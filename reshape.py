"""Reshape a flat Pydantic `Assessment` (+ the raw `Claim`) into the rich
front-end claim dict the React queue/detail panes consume.

The crux is `build_docs`: it rebuilds each source document's text into a list of
`{t:'text'|'ev'|'cv', ...}` parts by *locating the model's verbatim quotes* inside
the document text (the system prompt guarantees quotes are ctrl-F-able). The
located substring is taken from the document itself, so a highlight is always
byte-identical to its surrounding text even when the model normalized punctuation.

A quote that cannot be located is kept in the assessment (the reviewer still sees
it) but is NOT injected into the document; a reviewer warning is appended instead.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from models import Claim, Assessment, EvidenceItem


# ---- enum -> display maps -------------------------------------------------

# Assessment.recommended_action -> front-end ACTION_CONFIG key
ACTION_MAP = {
    "ROUTE_TO_DEMAND_LETTER": "ROUTE_TO_DEMAND",
    "GATHER_MORE_INFO": "GATHER_MORE_INFO",
    "REJECT": "REJECT",
    "DEFER_FOR_HUMAN_JUDGMENT": "DEFER",
}

# front-end action key -> human label (matches data.js ACTION_CONFIG labels)
ACTION_LABEL = {
    "ROUTE_TO_DEMAND": "ROUTE TO DEMAND LETTER",
    "GATHER_MORE_INFO": "GATHER MORE INFO",
    "REJECT": "REJECT",
    "DEFER": "DEFER",
}

LOB_LABEL = {
    "personal_auto": "Personal auto",
    "commercial_auto": "Commercial auto",
    "homeowners": "Homeowners",
    "commercial_property": "Commercial property",
    "workers_comp": "Workers comp",
    "general_liability": "General liability",
}

THIRD_PARTY_TYPE_LABEL = {
    "individual": "Individual",
    "company": "Company",
    "manufacturer": "Manufacturer",
    "premises_owner": "Premises owner",
    "unknown": "Unknown",
}

# doc_type -> keywords that might appear in an EvidenceItem.source label
DOC_TYPE_KEYWORDS = {
    "fnol": ("fnol", "first notice", "notice of loss"),
    "police_report": ("police", "incident report", "chp", "ppb"),
    "witness_statement": ("witness", "statement"),
    "adjuster_notes": ("adjuster", "adjustor", "claim notes"),
    "repair_estimate": ("repair", "estimate", "body shop", "auto body"),
    "medical_record": ("medical", "ed ", "hospital", "clinical"),
}

TIER_BANDS = {"HIGH": (0.80, 1.01), "MEDIUM": (0.55, 0.80), "LOW": (-0.01, 0.55)}


# ---- quote-location matching ladder ---------------------------------------

# 1:1 punctuation folds (length-preserving so offsets stay aligned with original)
_PUNCT_MAP = {
    ord("–"): "-",  # en dash
    ord("—"): "-",  # em dash
    ord("‘"): "'",  # left single quote
    ord("’"): "'",  # right single quote / apostrophe
    ord("“"): '"',  # left double quote
    ord("”"): '"',  # right double quote
    ord(" "): " ",  # non-breaking space
    ord("…"): ".",  # ellipsis (folds to a single char; good enough for anchoring)
}


def _punct_fold(s: str) -> str:
    return s.translate(_PUNCT_MAP)


def _ws_norm_with_map(text: str):
    """Collapse runs of whitespace to a single space.

    Returns (normalized_string, spans) where spans[i] = (start, end) is the
    half-open range in the ORIGINAL `text` covered by normalized char i.
    """
    norm_chars = []
    spans = []
    i, n = 0, len(text)
    while i < n:
        if text[i].isspace():
            j = i
            while j < n and text[j].isspace():
                j += 1
            norm_chars.append(" ")
            spans.append((i, j))
            i = j
        else:
            norm_chars.append(text[i])
            spans.append((i, i + 1))
            i += 1
    return "".join(norm_chars), spans


def _norm_quote(q: str) -> str:
    return re.sub(r"\s+", " ", q).strip()


def find_span(text: str, quote: str) -> Optional[tuple[int, int]]:
    """Locate `quote` within `text`. Returns (start, end) into `text`, or None.

    Ladder: exact -> whitespace-normalized -> punctuation+whitespace-normalized
    -> first/last-anchor (rescues a dropped interior word).
    """
    if not quote or not quote.strip():
        return None

    # Rung 1: exact
    idx = text.find(quote)
    if idx >= 0:
        return (idx, idx + len(quote))

    # Rung 2: whitespace-normalized
    norm_text, spans = _ws_norm_with_map(text)
    nq = _norm_quote(quote)
    k = norm_text.find(nq)
    if k >= 0 and nq:
        return (spans[k][0], spans[k + len(nq) - 1][1])

    # Rung 3: punctuation + whitespace normalized (folds are 1:1, so `spans`
    # built over the folded text still reference original indices)
    fnorm_text, fspans = _ws_norm_with_map(_punct_fold(text))
    fnq = _norm_quote(_punct_fold(quote))
    k = fnorm_text.find(fnq)
    if k >= 0 and fnq:
        return (fspans[k][0], fspans[k + len(fnq) - 1][1])

    # Rung 4: anchor match on first/last ~12 significant chars
    if len(fnq) >= 24:
        head, tail = fnq[:12], fnq[-12:]
        hs = fnorm_text.find(head)
        if hs >= 0:
            te = fnorm_text.find(tail, hs + 12)
            if te >= 0:
                end_norm = te + len(tail)
                # bound: matched region shouldn't sprawl far past the quote length
                if (end_norm - hs) <= len(fnq) * 2 + 40:
                    return (fspans[hs][0], fspans[end_norm - 1][1])

    return None


# ---- doc / evidence assembly ----------------------------------------------

def _resolve_doc_key(source: str, claim: Claim) -> Optional[str]:
    """Map an EvidenceItem.source label to one of the claim's document names."""
    if not claim.documents:
        return None
    names = [d.name for d in claim.documents]
    s = source.strip()
    sl = s.lower()

    # exact
    for name in names:
        if name == s:
            return name
    # startswith (either direction)
    for name in names:
        nl = name.lower()
        if nl.startswith(sl) or sl.startswith(nl):
            return name
    # substring (either direction)
    for name in names:
        nl = name.lower()
        if sl in nl or nl in sl:
            return name
    # doc_type keyword
    for doc in claim.documents:
        for kw in DOC_TYPE_KEYWORDS.get(doc.doc_type, ()):
            if kw in sl:
                return doc.name
    return None


def _assign_ids(items: list[EvidenceItem], claim: Claim, kind: str, warnings: list[str]):
    """Attach stable ids + resolved docKey to each evidence item.

    kind 'ev' -> integer ids 1..n ; kind 'cv' -> 'C1'..'Cn'.
    Returns list of dicts in the front-end evidence shape.
    """
    out = []
    fallback = claim.documents[0].name if claim.documents else "Document"
    for i, item in enumerate(items, start=1):
        ident = i if kind == "ev" else f"C{i}"
        doc_key = _resolve_doc_key(item.source, claim)
        if doc_key is None:
            doc_key = fallback
            warnings.append(
                f'Evidence source "{item.source}" did not match a known document; '
                f'attributed to "{fallback}".'
            )
        out.append({
            "id": ident,
            "docKey": doc_key,
            "source": doc_key,   # source == docKey so "click evidence -> open tab" works
            "quote": item.quote,
            "claim": item.claim,
        })
    return out


def build_docs(claim: Claim, supporting: list[dict], contradicting: list[dict], warnings: list[str]) -> dict:
    """Build docs{docKey:{parts:[...]}} by locating each quote in its document."""
    # group markers by docKey
    by_doc: dict[str, list[tuple]] = {}
    for ev in supporting:
        by_doc.setdefault(ev["docKey"], []).append((ev["id"], "ev", ev["quote"]))
    for cv in contradicting:
        by_doc.setdefault(cv["docKey"], []).append((cv["id"], "cv", cv["quote"]))

    docs: dict[str, dict] = {}
    for doc in claim.documents:
        key = doc.name
        text = doc.text
        markers = by_doc.get(key, [])

        located = []  # (start, end, kind, id)
        for ident, kind, quote in markers:
            span = find_span(text, quote)
            if span is None:
                warnings.append(
                    f'Evidence quote could not be located verbatim in "{key}"; '
                    f"shown in the assessment but not highlighted."
                )
                continue
            located.append((span[0], span[1], kind, ident))

        # resolve overlaps: prefer earlier start, then longer span
        located.sort(key=lambda s: (s[0], -(s[1] - s[0])))
        kept = []
        last_end = -1
        for start, end, kind, ident in located:
            if start >= last_end:
                kept.append((start, end, kind, ident))
                last_end = end
            else:
                warnings.append(
                    f'Overlapping evidence highlight in "{key}" skipped to keep the document readable.'
                )

        if not kept:
            docs[key] = {"parts": [{"t": "text", "v": text}]}
            continue

        parts = []
        pos = 0
        for start, end, kind, ident in kept:
            if start > pos:
                parts.append({"t": "text", "v": text[pos:start]})
            parts.append({"t": kind, "id": ident, "v": text[start:end]})
            pos = end
        if pos < len(text):
            parts.append({"t": "text", "v": text[pos:]})
        docs[key] = {"parts": parts}

    return docs


# ---- main entry -----------------------------------------------------------

def _ts(now: datetime) -> str:
    return now.strftime("%Y-%m-%d %H:%M UTC")


def assessment_to_claim(
    claim: Claim,
    a: Assessment,
    *,
    model_version: str,
    now: datetime,
    claim_id_override: Optional[str] = None,
) -> dict:
    """Produce the rich front-end claim dict from a raw Claim + flat Assessment."""
    warnings = list(a.reviewer_warnings)

    # tier (passthrough; warn on band mismatch but never override)
    tier = a.confidence_tier
    lo, hi = TIER_BANDS[tier]
    if not (lo <= a.confidence < hi):
        warnings.append(
            f"Confidence {a.confidence:.2f} is outside the stated {tier} band; "
            f"tier shown as returned by the model."
        )

    action = ACTION_MAP.get(a.recommended_action, "GATHER_MORE_INFO")
    if a.recommended_action not in ACTION_MAP:
        warnings.append(f'Unrecognized recommended_action "{a.recommended_action}"; defaulted to GATHER MORE INFO.')

    # third party (always a non-null object — the AssessmentPane dereferences .name)
    tp = a.third_party
    third_party = {
        "name": tp.name or "[Unconfirmed]",
        "type": THIRD_PARTY_TYPE_LABEL.get(tp.type, "Unknown"),
        "carrier": tp.carrier_or_insurer or "[Unknown]",
        "identified": tp.identified,
    }

    # evidence ids + resolved docKeys
    supporting = _assign_ids(a.supporting_evidence, claim, "ev", warnings)
    contradicting = _assign_ids(a.contradicting_evidence, claim, "cv", warnings)

    docs = build_docs(claim, supporting, contradicting, warnings)

    # SOL
    sol = a.statute_of_limitations
    sol_state = sol.state or claim.state
    if sol.expires is not None:
        sol_date = sol.expires.isoformat()
        sol_days = (sol.expires - now.date()).days
        sol_urgent = sol_days <= 30
    else:
        sol_date = "No SOL on record"
        sol_days = 9999
        sol_urgent = False

    claim_id = claim_id_override or claim.claim_id
    ts = _ts(now)

    return {
        "id": claim_id,
        "confidence": a.confidence,
        "tier": tier,
        "lob": LOB_LABEL.get(claim.line_of_business, claim.line_of_business),
        "fnolRelative": "Just now",
        "recovery": a.estimated_recovery_usd or 0,
        "recoveryBasis": a.estimated_recovery_basis or "",
        "solDate": sol_date,
        "solUrgent": sol_urgent,
        "solDays": sol_days,
        "solState": sol_state,
        "thesis": a.thesis,
        "action": action,
        "status": "pending",
        "thirdParty": third_party,
        "evidence": supporting,
        "contradicting": contradicting,
        "warnings": warnings,
        "openQuestions": list(a.open_questions),
        "docs": docs,
        "auditTrail": [
            {"ts": ts, "type": "claim_received", "detail": "FNOL submitted via demo drop"},
            {
                "ts": ts,
                "type": "model_run",
                "modelVersion": model_version,
                "confidence": a.confidence,
                "detail": "Flagged: " + ACTION_LABEL[action],
            },
        ],
    }
