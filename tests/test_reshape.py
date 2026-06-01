"""Unit tests for reshape.py — run with: python -m pytest tests/ -q  (from repo root)."""

import json
from datetime import datetime, timezone
from pathlib import Path

from models import Claim, Assessment
from reshape import find_span, assessment_to_claim

ROOT = Path(__file__).resolve().parent.parent
NOW = datetime(2026, 5, 31, 12, 0, tzinfo=timezone.utc)


def _load_claim(name: str) -> Claim:
    return Claim.model_validate_json((ROOT / "data" / "sample_claims" / name).read_text(encoding="utf-8"))


# ---- find_span matching ladder -------------------------------------------

def test_find_span_exact():
    text = "The quick brown fox."
    assert find_span(text, "quick brown") == (4, 15)


def test_find_span_collapses_newlines_and_runs():
    text = "Officer narrative:\n\nParty 2 was   traveling northbound."
    span = find_span(text, "Party 2 was traveling northbound")
    assert span is not None
    assert text[span[0]:span[1]] == "Party 2 was   traveling northbound"


def test_find_span_folds_en_dash():
    text = "Impact speed approximately 30–35 MPH, no braking."
    # model returned a hyphen instead of the document's en dash
    span = find_span(text, "30-35 MPH")
    assert span is not None
    assert text[span[0]:span[1]] == "30–35 MPH"  # original substring preserved


def test_find_span_folds_curly_quotes():
    text = "He said “I didn’t see it” to the officer."
    span = find_span(text, '"I didn\'t see it"')
    assert span is not None
    assert text[span[0]:span[1]] == "“I didn’t see it”"


def test_find_span_not_found():
    assert find_span("nothing relevant here", "completely different text") is None


# ---- assessment_to_claim integration -------------------------------------

def _rear_end_assessment() -> Assessment:
    return Assessment.model_validate({
        "subrogation_likely": True,
        "confidence": 0.93,
        "confidence_tier": "HIGH",
        "thesis": "Marcus Rivera rear-ended the stationary insured and admitted fault.",
        "third_party": {
            "identified": True, "name": "Marcus Rivera",
            "type": "individual", "carrier_or_insurer": "State Farm (SF-489201-A)",
        },
        "supporting_evidence": [
            {"source": "FNOL Narrative",
             "quote": "A blue Toyota Camry struck her from behind.",
             "claim": "Third-party vehicle struck the insured from behind."},
            {"source": "Police Report PDX-2026-7741",
             "quote": "Marcus Rivera stated 'I was looking at my phone and didn't see her stop.'",
             "claim": "Third party admitted inattention to the officer."},
            {"source": "Witness Statement: Patricia Hwang",
             "quote": "The Camry behind her rolled into her without braking.",
             "claim": "Independent witness corroborates fault."},
        ],
        "contradicting_evidence": [],
        "estimated_recovery_usd": 8500,
        "estimated_recovery_basis": "Repair estimate $8,500.",
        "statute_of_limitations": {
            "state": "OR", "years_from_loss": 2,
            "loss_date": "2026-05-21", "expires": "2028-05-21",
        },
        "recommended_action": "ROUTE_TO_DEMAND_LETTER",
        "open_questions": [],
        "reviewer_warnings": [],
    })


def test_rear_end_reshape_shape_and_highlights():
    claim = _load_claim("claim_001_rear_end.json")
    out = assessment_to_claim(claim, _rear_end_assessment(),
                              model_version="claude-sonnet-4-6", now=NOW,
                              claim_id_override="CLM-2026-09001")

    # top-level mapping
    assert out["id"] == "CLM-2026-09001"
    assert out["tier"] == "HIGH"
    assert out["action"] == "ROUTE_TO_DEMAND"
    assert out["lob"] == "Personal auto"
    assert out["status"] == "pending"
    assert out["fnolRelative"] == "Just now"
    assert out["recovery"] == 8500
    assert out["thirdParty"]["name"] == "Marcus Rivera"
    assert out["thirdParty"]["type"] == "Individual"

    # SOL well in the future -> not urgent
    assert out["solDate"] == "2028-05-21"
    assert out["solUrgent"] is False
    assert out["solDays"] > 600

    # evidence ids assigned 1..n and docKeys resolved to real document names
    doc_names = {d.name for d in claim.documents}
    assert [e["id"] for e in out["evidence"]] == [1, 2, 3]
    for e in out["evidence"]:
        assert e["docKey"] in doc_names
        assert e["source"] == e["docKey"]

    # every document is present as a tab
    assert set(out["docs"].keys()) == doc_names

    # all three quotes located and highlighted (no "could not be located" warnings)
    assert not any("could not be located" in w for w in out["warnings"])
    ev_parts = [p for doc in out["docs"].values() for p in doc["parts"] if p["t"] == "ev"]
    assert {p["id"] for p in ev_parts} == {1, 2, 3}

    # highlighted text is byte-identical to the document substring it came from
    for doc_key, doc in out["docs"].items():
        rebuilt = "".join(p["v"] for p in doc["parts"])
        original = next(d.text for d in claim.documents if d.name == doc_key)
        assert rebuilt == original

    # seeded audit trail
    assert out["auditTrail"][0]["type"] == "claim_received"
    assert out["auditTrail"][1]["modelVersion"] == "claude-sonnet-4-6"


def test_unfindable_quote_warns_but_keeps_evidence():
    claim = _load_claim("claim_001_rear_end.json")
    a = _rear_end_assessment()
    # replace one quote with text that does not appear verbatim
    a.supporting_evidence[0].quote = "This sentence does not exist in the FNOL at all."
    out = assessment_to_claim(claim, a, model_version="m", now=NOW)
    assert any("could not be located" in w for w in out["warnings"])
    # evidence item is still present for the reviewer
    assert any(e["id"] == 1 for e in out["evidence"])
    # but it produced no highlight in the FNOL
    fnol_parts = out["docs"]["FNOL Narrative"]["parts"]
    assert all(not (p["t"] == "ev" and p["id"] == 1) for p in fnol_parts)
