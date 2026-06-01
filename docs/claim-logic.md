# Claim Creation & Evaluation — Code Walkthrough

This document traces, end to end, how a claim is created, evaluated, scored, and how
the evidence highlights are determined. It uses the codebase as ground truth — every
step cites the file and function that implements it.

> **Key takeaway up front:** the *score* is **not computed by this app**. The
> confidence number and tier are produced by the model (live) or read from a fixed
> canned file (simulated). The backend's job is to **validate, map, and locate** —
> the one number the code actually *computes* is the SOL countdown (`solDays`).

---

## 1. The pipeline at a glance

```
 Drop a claim (UI)
        │  POST /api/analyze {template}
        ▼
 app.py: api_analyze()                         ── pick the input + get an assessment
        │   TEMPLATE_TO_SAMPLE → data/sample_claims/*.json  →  Claim (Pydantic)
        │
        ├─ live:      llm.assess_claim(claim)        → Anthropic → Assessment   (the score lives here)
        └─ simulated: llm.simulate_assessment(t)     → canned JSON → Assessment (fixed score)
        │
        ▼
 reshape.assessment_to_claim(claim, assessment)   ── map flat → rich, LOCATE highlights, COMPUTE SOL
        │
        ▼
 store.add_claim(claim_dict, …)                    ── prepend to queue + write 2 audit rows, persist
        │
        ▼
 Front-end (ClaimDetail.jsx)                       ── render score chip + highlighted documents
```

Two representations exist and must not be confused:

| Representation | Defined in | Shape |
|---|---|---|
| **`Assessment`** (the model contract) | `models.py` | flat: `confidence`, `confidence_tier`, `supporting_evidence[]`, `statute_of_limitations{}`, … |
| **front-end claim dict** (the UI contract) | produced by `reshape.py` | rich: `tier`, `recovery`, `solDays`, `evidence[]`, `docs{parts[]}`, `auditTrail[]`, … |

---

## 2. Claim creation — choosing the input

`app.py › api_analyze()` is the entry point. The dropped "template" is mapped to one of
the three sample-claim files, which carry the **full document text**:

```python
TEMPLATE_TO_SAMPLE = {
    "straightforward": "claim_001_rear_end.json",
    "ambiguous":       "claim_002_slip_fall.json",
    "failure":         "claim_003_dui_defect.json",
}
...
claim = Claim.model_validate_json(sample_path.read_text(encoding="utf-8"))
new_id = store.next_claim_id()
```

- `Claim` (`models.py`) validates the raw input: `claim_id`, `line_of_business`, `state`,
  `fnol_date`, `loss_date`, `paid_amount_usd`, and a list of `Document{name, doc_type, text}`.
- `store.next_claim_id()` allocates a fresh `CLM-YYYY-NNNNN` id above every existing claim.

---

## 3. Evaluation — where the assessment (and the score) comes from

`api_analyze()` prefers a **live** call when an API key is present, and falls back to a
**simulated** (canned) assessment otherwise. Every branch is guarded so the endpoint can
always degrade to the seed template rather than 500:

```python
if llm.has_api_key():
    try:
        assessment, model_version = await asyncio.to_thread(llm.assess_claim, claim)  # LIVE
        source = "live"
    except Exception:
        ...  # warning; fall through to simulated
if assessment is None:
    assessment, model_version = llm.simulate_assessment(template)                     # SIMULATED
    source = "simulated"
```

### 3a. Live path — `llm.assess_claim()`

```python
response = client.messages.create(
    model=model_name(),                 # default "claude-sonnet-4-6"
    max_tokens=4000,
    system=load_system_prompt(),        # prompts/subro_detector.txt
    messages=[{"role": "user", "content": format_claim_for_prompt(claim)}],
    timeout=REQUEST_TIMEOUT_S,
)
text = _extract_text(response).strip()
text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
data = json.loads(text)
return Assessment.model_validate(data), response.model
```

The model is asked to return a single JSON object; we strip any code fences, parse it,
and **Pydantic-validate it against `Assessment`**. An out-of-enum `confidence_tier` or
`recommended_action`, or malformed JSON, raises — and `api_analyze` catches it and falls
back to the simulated assessment.

### 3b. The score itself — produced by the model, per the prompt rubric

**There is no scoring formula in the code.** `confidence` (a float 0–1) and
`confidence_tier` (HIGH/MEDIUM/LOW) are fields the model fills in, guided by the
calibration rules in `prompts/subro_detector.txt`:

```
3. Confidence calibration:
   - HIGH   (>= 0.80): clean recovery, named third party, evidence is uncontested
   - MEDIUM (0.55 to 0.79): plausible recovery, some uncertainty about party or liability
   - LOW    (< 0.55): weak signal, missing party, contradicting evidence, or ambiguous facts
   Do not anchor confidence to your fluency. A coherent paragraph is not a confident assessment.
```

The prompt also dictates `recommended_action` (ROUTE_TO_DEMAND_LETTER / GATHER_MORE_INFO /
REJECT / DEFER_FOR_HUMAN_JUDGMENT) from confidence + party identification, and requires
that contradicting evidence (DUI, admitted fault, intervening cause) be surfaced
explicitly. So the "intelligence" of the score is entirely in the prompt + model.

### 3c. Simulated path — `llm.simulate_assessment()`

```python
data = json.loads((CANNED_DIR / f"{template_key}.json").read_text(encoding="utf-8"))
return Assessment.model_validate(data), f"{model_name()} (simulated)"
```

The three files in `data/canned_assessments/` are hand-authored `Assessment`s with
**fixed** confidences (`straightforward` 0.92 HIGH, `ambiguous` 0.62 MEDIUM,
`failure` 0.30 LOW) and verbatim quotes drawn from the matching sample document. They go
through the *identical* reshape pipeline as live output, so a simulated drop looks exactly
like a live one — just deterministic.

### 3d. The only score-related logic in the backend: a band sanity-check

`reshape.assessment_to_claim()` passes the tier through unchanged, but **flags** (via a
reviewer warning) if the model's numeric confidence contradicts the band its own tier
label claims. It never overrides the model:

```python
TIER_BANDS = {"HIGH": (0.80, 1.01), "MEDIUM": (0.55, 0.80), "LOW": (-0.01, 0.55)}
...
tier = a.confidence_tier
lo, hi = TIER_BANDS[tier]
if not (lo <= a.confidence < hi):
    warnings.append(f"Confidence {a.confidence:.2f} is outside the stated {tier} band; "
                    f"tier shown as returned by the model.")
```

---

## 4. Reshape — flat `Assessment` → rich front-end claim

`reshape.assessment_to_claim(claim, a, *, model_version, now, claim_id_override)` builds
the dict the UI consumes. Field-by-field:

| Front-end field | Source / logic | Code |
|---|---|---|
| `confidence` | passthrough of `a.confidence` (the model's score) | `reshape.py:340` |
| `tier` | passthrough of `a.confidence_tier` (+ band warning) | `:296–302` |
| `action` | `ACTION_MAP[a.recommended_action]`, default `GATHER_MORE_INFO` | `:304–306` |
| `lob` | `LOB_LABEL[claim.line_of_business]` | `:342` |
| `thirdParty` | always non-null; `name or "[Unconfirmed]"`, `carrier_or_insurer or "[Unknown]"`, type label | `:308–315` |
| `recovery` | `a.estimated_recovery_usd or 0` (UI calls `.toLocaleString()`) | `:344` |
| **`solDays` / `solUrgent` / `solDate`** | **computed** (see §6) | `:323–333` |
| `evidence` / `contradicting` | id-assigned, docKey-resolved (see §5) | `:317–319` |
| `docs` | text split into highlight `parts` (see §5) | `:321` |
| `auditTrail` | seeded `claim_received` + `model_run` rows | `:359–368` |

---

## 5. Highlight determination (the core)

Highlights are built so the reviewer can ctrl-F every cited quote in the source document.
There are three sub-steps: **resolve which document**, **locate the quote in its text**,
and **split the text into renderable parts**.

### 5a. Assign stable ids and resolve the document — `_assign_ids` + `_resolve_doc_key`

Each `EvidenceItem` gets an id and is mapped to a real document name:

- Supporting evidence → integer ids `1, 2, 3 …`
- Contradicting evidence → string ids `"C1", "C2" …`

```python
ident = i if kind == "ev" else f"C{i}"
doc_key = _resolve_doc_key(item.source, claim)   # match the model's source label to a real doc
...
out.append({"id": ident, "docKey": doc_key, "source": doc_key, "quote": ..., "claim": ...})
```

`_resolve_doc_key` tries, in order: **exact** name match → **startswith** (either
direction) → **substring** (either direction) → **doc_type keyword** (e.g. `"police"` →
`police_report`). If nothing matches, it falls back to the first document and appends a
warning. Note `source` is set equal to `docKey` so "click the evidence item → open that
document tab" works on the front end.

### 5b. Locate each quote — `find_span()` matching ladder

`find_span(text, quote)` returns `(start, end)` offsets into the **original** document
text, climbing a 4-rung ladder so a quote still lands even if the model normalized
whitespace or punctuation:

1. **Exact** — `text.find(quote)`.
2. **Whitespace-normalized** — collapse runs of whitespace (incl. newlines) to a single
   space via `_ws_norm_with_map`, which also returns a `spans` array mapping each
   normalized char back to its `(start, end)` range in the original. The match offsets are
   mapped back: `(spans[k][0], spans[k + len(nq) - 1][1])`.
3. **Punctuation + whitespace-normalized** — first fold en/em dashes → `-`, curly quotes →
   straight, NBSP → space, ellipsis → `.` via `_PUNCT_MAP` (a **1:1, length-preserving**
   translation, so offsets stay aligned to the original), then whitespace-normalize. This
   is the rung that catches `30–35 MPH` (en dash) vs the model's `30-35 MPH` (hyphen).
4. **Anchor** — for quotes ≥ 24 chars, match on the first ~12 and last ~12 significant
   chars within a bounded window, rescuing a quote that dropped an interior word.

Because the located span indexes the **original** text, the highlighted substring is
always byte-identical to the surrounding document — even when the match was found via a
normalized rung.

```python
located.append((span[0], span[1], kind, ident))   # build_docs
```

If `find_span` returns `None`, the quote is **not** injected into the document; instead a
warning is appended ("Evidence quote could not be located verbatim…") and the item still
appears in the assessment list. (We never fabricate a highlight.)

### 5c. Split the document into parts — `build_docs()`

For each document, the located spans are sorted and de-overlapped (earlier start wins,
then longer span; a nested/overlapping highlight is skipped with a warning so the text
stays readable), then the text is walked left-to-right, emitting parts:

```python
for start, end, kind, ident in kept:
    if start > pos:
        parts.append({"t": "text", "v": text[pos:start]})   # plain text before the span
    parts.append({"t": kind, "id": ident, "v": text[start:end]})  # 'ev' or 'cv' highlight
    pos = end
if pos < len(text):
    parts.append({"t": "text", "v": text[pos:]})            # trailing text
```

Every document gets a `docs[name] = {"parts": [...]}` entry (a doc with no located quotes
is a single `{"t":"text"}` part), so all tabs render. The part's `id` is the linkage key
back to the matching `evidence[]` / `contradicting[]` item.

---

## 6. The one number the code actually computes — SOL countdown

The model returns an `expires` date in `statute_of_limitations`. The backend computes the
day count and urgency against "today":

```python
sol = a.statute_of_limitations
sol_state = sol.state or claim.state
if sol.expires is not None:
    sol_date  = sol.expires.isoformat()
    sol_days  = (sol.expires - now.date()).days      # ← computed
    sol_urgent = sol_days <= 30                       # ← computed (drives the red UI state)
else:
    sol_date, sol_days, sol_urgent = "No SOL on record", 9999, False
```

`solUrgent` drives the red "⏱ EXPIRES IN N DAYS" treatment and the "SOL within 30 days"
metric tile. The statute *length* itself (e.g. OR 2yr, WA 3yr) is applied by the model per
rule 5 of the system prompt; the code only does the date arithmetic against today.

---

## 7. Persistence + audit — `store.add_claim()`

The reshaped claim is prepended to the queue and two global audit rows are written
(model_run + claim_received), then both `data/state/*.json` files are atomically rewritten.
The model_run row records the model label, the confidence, the action, and the prompt
version:

```python
note = {"live": "live model run", "simulated": "simulated model run"}[source]
if prompt_version: note = f"{note} · prompt {prompt_version}"
_audit.insert(0, {"ts": ts, "claimId": claim["id"], "type": "model_run",
                  "modelVersion": model_version, "action": action_label,
                  "confidence": claim.get("confidence"), "notes": note})
```

---

## 8. Rendering — how parts become highlights, and how the score is shown

### 8a. The score chip

`AssessmentPane` (ClaimDetail.jsx) renders `<ConfidenceChip confidence={claim.confidence}
tier={claim.tier} />` — the colored badge (green HIGH / amber MEDIUM / red LOW) with the
numeric score. No calculation; it just displays the passed-through values.

### 8b. Highlighted document — `DocumentPane.renderParts()`

Each `part` becomes a `<span>`:

- `t:'text'` → plain `white-space: pre-wrap` span.
- `t:'ev'` → supporting highlight, amber `#FEF3C7` (active `#FDE68A` + amber ring), prefixed
  with a numbered `EvBadge` (①②③…).
- `t:'cv'` → contradicting highlight, orange `#FED7AA` (active `#FDBA74` + orange ring), with
  a ⚠ badge.

```jsx
if (part.t === 'ev') {
  const isActive = activeEvId === part.id;
  return (<span ref={el => { evRefs.current[String(part.id)] = el; }}
    style={{ background: isActive ? '#FDE68A' : '#FEF3C7', ... }}
    onClick={() => setActiveEvId(isActive ? null : part.id)}>
    <EvBadge id={part.id} isContra={false} />{part.v}
  </span>);
}
```

### 8c. Cross-linking (assessment ↔ document)

The `id` produced in §5a is the shared key:

- Clicking an **evidence item** in the assessment pane calls
  `onEvidenceClick(ev.id, ev.docKey)`, which sets `activeDoc` (switching tabs) and
  `activeEvId`. `DocumentPane`'s `useEffect` then scrolls the matching `ev`/`cv` span
  (looked up by `id` in `evRefs`) into view and applies the active highlight.
- Clicking the **highlighted span** in the document toggles `activeEvId`, lighting up the
  corresponding assessment item.

So the numbered badge in the document and the card in the assessment pane are two views of
the same `evidence[]` entry, joined by `id`.

---

## 9. Worked example — the "failure" (DUI/defect) case

This is the design's hard test, and it shows the pieces working together:

1. **Input:** `claim_003_dui_defect.json` — single-vehicle crash, DUI on the police report,
   plus an unverified repair-shop "stuck throttle" remark.
2. **Evaluation:** the model (or canned `failure.json`) returns `confidence ≈ 0.30`,
   `confidence_tier: "LOW"`, `recommended_action: "REJECT"` (or DEFER), `third_party`
   **not** confidently named, and the DUI lines under `contradicting_evidence`.
3. **Reshape:** tier → LOW (red), action → REJECT, the DUI quotes get `cv` ids `C1/C2`,
   `find_span` locates them verbatim in the police report, and `build_docs` emits orange
   `cv` highlights. SOL computed from the CA `expires` date.
4. **Render:** red confidence chip, the DUI evidence highlighted in orange with ⚠ badges,
   reviewer warnings populated — so the reviewer can see *why* the model is unsure and
   reject it. The structured output surfaces the contradiction instead of hiding it.

---

## File / function index

| Concern | File · function |
|---|---|
| Entry point, live/simulated/fallback orchestration | `app.py` · `api_analyze()` |
| Live model call + JSON parse + validate | `llm.py` · `assess_claim()` |
| Simulated (canned) assessment | `llm.py` · `simulate_assessment()` |
| Prompt + scoring rubric | `prompts/subro_detector.txt` |
| Assessment schema | `models.py` · `Assessment` |
| Flat → rich mapping, SOL math, tier band check | `reshape.py` · `assessment_to_claim()` |
| Quote → document resolution | `reshape.py` · `_resolve_doc_key()`, `_assign_ids()` |
| Quote location (matching ladder) | `reshape.py` · `find_span()` |
| Text → highlight parts | `reshape.py` · `build_docs()` |
| Persistence + audit rows | `store.py` · `add_claim()` |
| Score chip | `web/ClaimDetail.jsx` · `AssessmentPane` / `components.jsx` · `ConfidenceChip` |
| Highlight rendering + cross-link | `web/ClaimDetail.jsx` · `DocumentPane.renderParts()` |
