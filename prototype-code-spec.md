# Subrogation Opportunity Scout — Code Spec

**For:** Claude Code build session
**Target:** Working Streamlit prototype demonstrating the H2 thin slice for an Invisible interview demo on Monday
**Owner:** Molly
**Date:** 2026-05-28

---

## Project overview

A Streamlit app that demonstrates an LLM-powered subrogation detection workflow for P&C insurance claims. The reviewer sees a queue of flagged claims, opens any claim to see the AI's structured assessment plus the source documents the model cited, takes an action (confirm, gather more info, reject, defer), and the audit log captures every step. A "drop a new claim" affordance runs a live Anthropic API call on a sample claim so the panel can watch the model think.

This is a 2-3 hour build. Polish is secondary to working end-to-end.

---

## ⚠️ AS-BUILT NOTE (supersedes parts of this spec)

The spec below describes the original design. The prototype was actually built to
reconcile this spec with the **high-fidelity React design handoff**
(`design_handoff_subrogation_scout/`), and with two decisions made during the build:

1. **Stack:** Instead of Streamlit, the app is the **pixel-perfect React prototype**
   (zero-build, CDN React + Babel) served by a **thin FastAPI backend** from the same
   origin. The Pydantic schema, system prompt, and the 3 sample claims from this spec
   are reused as-is.
2. **Live model call with a simulated fallback.** "Drop a new claim" makes a **live
   Anthropic call** on one of the 3 sample claims when `ANTHROPIC_API_KEY` is set
   (env var or `.env`), reshaping the structured result into the queue UI. When no key
   is set — or a call fails — it falls back to a **deterministic, pre-written
   assessment** (one canned `Assessment` per sample claim, in `data/canned_assessments/`)
   run through the same reshape pipeline, so the demo works either way and the dropped
   claim always gets full documents with verbatim-quote highlights. The audit log labels
   each run `live model run` or `simulated model run`. Model defaults to
   `claude-sonnet-4-6`, overridable via `CLAUDE_MODEL`.

Where this spec says "Streamlit", read it as superseded (the app is React + FastAPI).
The data models, system prompt, three test-case behaviors, audit log, and reviewer
workflow remain as specified. See `README.md` for the as-built architecture.

---

## Tech stack

- **Python 3.11+**
- **Streamlit** for the UI (`streamlit>=1.32`)
- **Anthropic Python SDK** (`anthropic>=0.40`) for live LLM calls
- **Pydantic v2** for the structured output schema
- **python-dotenv** for API key management
- No database. Audit log is a JSON file appended to on disk.
- No auth. Single user. Local-only.

Target: runs with `streamlit run app.py` on Windows / macOS / Linux. No Docker, no cloud deployment required for the demo. Streamlit Cloud deploy as optional fallback.

---

## Repo structure

```
subrogation-scout/
├── app.py                        # Streamlit entry point + page routing
├── llm.py                        # Anthropic API wrapper, schema, prompt
├── models.py                     # Pydantic dataclasses
├── audit.py                      # Audit log read/write
├── prompts/
│   └── subro_detector.txt        # System prompt (literal)
├── data/
│   ├── sample_claims/
│   │   ├── claim_001_rear_end.json       # straightforward test case
│   │   ├── claim_002_slip_fall.json      # ambiguous test case
│   │   └── claim_003_dui_defect.json     # failure-mode test case
│   ├── pre_flagged_queue.json    # seed claims so queue is non-empty on first load
│   └── audit_log.json            # appended to during runs
├── .env.example                  # ANTHROPIC_API_KEY=
├── .gitignore                    # .env, __pycache__, *.pyc, audit_log live state
├── requirements.txt
└── README.md
```

**Build location:** `C:\Users\pixie\OneDrive\Documents\codeprojects\InvisiblePrototype\` — this folder IS the repo root. Ignore the `subrogation-scout/` wrapper name in the tree above; create the files (`app.py`, `llm.py`, etc.) directly inside `InvisiblePrototype`. Run `git init` here.

**Model:** `claude-sonnet-4-6` (confirmed by Molly; keep the `CLAUDE_MODEL` env override).

---

## Data models (`models.py`)

Use Pydantic v2.

```python
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import date, datetime

class Document(BaseModel):
    """One source document attached to a claim."""
    name: str                # e.g., "FNOL Narrative", "Police Report", "Witness Statement #1"
    doc_type: Literal["fnol", "police_report", "witness_statement", "adjuster_notes",
                      "repair_estimate", "medical_record", "other"]
    text: str                # the full text body

class Claim(BaseModel):
    """The raw claim data the model receives."""
    claim_id: str
    line_of_business: Literal["personal_auto", "commercial_auto", "homeowners",
                              "commercial_property", "workers_comp", "general_liability"]
    state: str               # two-letter code, governs SOL
    fnol_date: date
    loss_date: date
    paid_amount_usd: Optional[int] = None
    documents: list[Document]

class ThirdParty(BaseModel):
    identified: bool
    name: Optional[str] = None
    type: Literal["individual", "company", "manufacturer", "premises_owner", "unknown"]
    carrier_or_insurer: Optional[str] = None

class EvidenceItem(BaseModel):
    source: str              # which document
    quote: str               # verbatim quote from source
    claim: str               # what this evidence proves (or complicates)

class StatuteOfLimitations(BaseModel):
    state: Optional[str] = None
    years_from_loss: Optional[int] = None
    loss_date: Optional[date] = None
    expires: Optional[date] = None

class Assessment(BaseModel):
    """The LLM's structured output for a single claim."""
    subrogation_likely: bool
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_tier: Literal["HIGH", "MEDIUM", "LOW"]
    thesis: str
    third_party: ThirdParty
    supporting_evidence: list[EvidenceItem]
    contradicting_evidence: list[EvidenceItem]
    estimated_recovery_usd: Optional[int] = None
    estimated_recovery_basis: Optional[str] = None
    statute_of_limitations: StatuteOfLimitations
    recommended_action: Literal["ROUTE_TO_DEMAND_LETTER", "GATHER_MORE_INFO",
                                "REJECT", "DEFER_FOR_HUMAN_JUDGMENT"]
    open_questions: list[str]
    reviewer_warnings: list[str]

class ReviewerDecision(BaseModel):
    claim_id: str
    decision: Literal["CONFIRMED_DEMAND_LETTER", "REQUESTED_MORE_INFO",
                      "REJECTED", "DEFERRED"]
    reviewer_id: str
    reviewer_notes: str
    timestamp: datetime

class AuditEntry(BaseModel):
    timestamp: datetime
    claim_id: str
    event_type: Literal["model_run", "reviewer_action", "claim_received"]
    model_version: Optional[str] = None         # e.g., "claude-sonnet-4-6"
    prompt_version: Optional[str] = None        # SHA or version string
    assessment: Optional[Assessment] = None
    reviewer_decision: Optional[ReviewerDecision] = None
    notes: Optional[str] = None
```

---

## The system prompt (`prompts/subro_detector.txt`)

```
You are an AI assistant supporting a Property & Casualty insurance subrogation
specialist. Your job is to analyze a newly opened claim and detect whether the
claim presents a subrogation opportunity, meaning a third party may be financially
responsible such that the carrier can recover paid claim dollars.

You will be given:
- The Claim metadata (claim ID, line of business, state, FNOL date, loss date,
  amount paid)
- A list of source documents (FNOL narrative, police report, witness statements,
  adjuster notes, repair estimates, etc.)

You will produce a single JSON object matching the schema below. Output JSON
only, with no preamble or commentary.

Schema:
{
  "subrogation_likely": <boolean>,
  "confidence": <float 0.0 to 1.0, calibrated to evidence strength>,
  "confidence_tier": "HIGH" or "MEDIUM" or "LOW",
  "thesis": <one sentence: who is the at-fault third party and why>,
  "third_party": {
    "identified": <boolean>,
    "name": <string or null>,
    "type": "individual" | "company" | "manufacturer" | "premises_owner" | "unknown",
    "carrier_or_insurer": <string or null>
  },
  "supporting_evidence": [
    {"source": <document name>, "quote": <verbatim from source>, "claim": <what it proves>}
  ],
  "contradicting_evidence": [
    {"source": <document name>, "quote": <verbatim>, "claim": <what it complicates>}
  ],
  "estimated_recovery_usd": <integer or null>,
  "estimated_recovery_basis": <string explaining the math>,
  "statute_of_limitations": {
    "state": <2-letter code or null>,
    "years_from_loss": <integer or null>,
    "loss_date": <YYYY-MM-DD or null>,
    "expires": <YYYY-MM-DD or null>
  },
  "recommended_action": "ROUTE_TO_DEMAND_LETTER" or "GATHER_MORE_INFO" or "REJECT" or "DEFER_FOR_HUMAN_JUDGMENT",
  "open_questions": [<string>],
  "reviewer_warnings": [<string>]
}

CRITICAL RULES:

1. Never invent facts. If information is not in the documents, do not state it
   as known. Use null and add the gap to "open_questions".

2. Every entry in supporting_evidence and contradicting_evidence MUST quote source
   text verbatim. The reviewer must be able to ctrl-F the quote in the source
   document. If you cannot quote verbatim, do not assert the claim.

3. Confidence calibration:
   - HIGH (>= 0.80): clean recovery, named third party, evidence is uncontested
   - MEDIUM (0.55 to 0.79): plausible recovery, some uncertainty about party or
     liability
   - LOW (< 0.55): weak signal, missing party, contradicting evidence, or
     ambiguous facts
   Do not anchor confidence to your fluency. A coherent paragraph is not a
   confident assessment.

4. If contradicting evidence exists (the policyholder admits fault, DUI, an
   intervening cause, prior damage, etc.), surface it explicitly. Do not minimize.
   The reviewer needs to see what makes you uncertain.

5. Statute of limitations: Apply the relevant state's tort statute. Common P&C
   tort SOLs by state (use these unless the claim metadata overrides):
   OR 2yr, WA 3yr, CA 2yr, TX 2yr, NY 3yr, FL 4yr, IL 2yr, GA 4yr, AZ 2yr.
   If state or loss_date is missing, leave SOL fields null and add to
   open_questions.

6. recommended_action guidance:
   - ROUTE_TO_DEMAND_LETTER: HIGH confidence + named third party + sufficient evidence
   - GATHER_MORE_INFO: MEDIUM confidence OR missing third-party identification
   - REJECT: subrogation unlikely OR policyholder is at fault OR contradicting
     evidence dominant
   - DEFER_FOR_HUMAN_JUDGMENT: novel facts pattern, conflict of laws, or anything
     where a reasonable specialist would want a second opinion

7. reviewer_warnings: Anything the reviewer should pause on. Examples:
   "Single-vehicle DUI claim; intervening cause may bar recovery", "Loss date
   missing, SOL cannot be computed", "Recommended action depends on whether the
   carrier holds a subrogation waiver in this contract".

8. Be honest about what you don't know. The reviewer's trust is the product.
```

---

## Test case files

### `data/sample_claims/claim_001_rear_end.json` — STRAIGHTFORWARD

```json
{
  "claim_id": "CLM-2026-00481",
  "line_of_business": "personal_auto",
  "state": "OR",
  "fnol_date": "2026-05-22",
  "loss_date": "2026-05-21",
  "paid_amount_usd": 8500,
  "documents": [
    {
      "name": "FNOL Narrative",
      "doc_type": "fnol",
      "text": "Policyholder Sarah Chen reports she was stopped at a red light at the intersection of SE 39th Ave and SE Hawthorne Blvd in Portland, OR on May 21, 2026 at approximately 4:45 PM. A blue Toyota Camry struck her from behind. The driver of the Camry exited the vehicle, apologized, and provided his information: Marcus Rivera, insured by State Farm, policy SF-489201-A. Photos taken at the scene show rear bumper damage to her 2022 Honda Civic. Police were called and a report was filed. No injuries reported by either party. Estimated repair $8,500."
    },
    {
      "name": "Police Report PDX-2026-7741",
      "doc_type": "police_report",
      "text": "Portland Police Bureau Incident Report PDX-2026-7741. Date: May 21, 2026. Time: 16:47. Location: SE 39th Ave and SE Hawthorne Blvd. Officer Reyes responding. Driver 1: Sarah Chen, 2022 Honda Civic, OR plate 884-JFK. Driver 2: Marcus Rivera, 2019 Toyota Camry, OR plate 219-MKL. Marcus Rivera stated 'I was looking at my phone and didn't see her stop.' Rivera cited for following too closely and inattentive driving. No injuries on scene. Both vehicles driveable; Chen's vehicle had moderate rear bumper damage."
    },
    {
      "name": "Witness Statement: Patricia Hwang",
      "doc_type": "witness_statement",
      "text": "I was walking on the southwest corner of SE 39th and Hawthorne when I heard the impact. The Honda was stopped at the red light. The Camry behind her rolled into her without braking. I gave my contact info to the police. Patricia Hwang, 503-555-0142."
    },
    {
      "name": "Repair Estimate: Hawthorne Auto Body",
      "doc_type": "repair_estimate",
      "text": "Hawthorne Auto Body. Vehicle: 2022 Honda Civic, VIN 19XFC2F69NE000482. Damage: rear bumper cover, rear bumper reinforcement, rear panel dent, tail light assembly (left). Parts and labor: $8,500.00. Estimator: J. Tran."
    }
  ]
}
```

**Expected assessment:**
- subrogation_likely: true
- confidence_tier: HIGH (>= 0.85)
- third_party.name: Marcus Rivera
- third_party.carrier_or_insurer: State Farm (policy SF-489201-A)
- estimated_recovery_usd: 8500
- SOL: OR, 2 yrs, expires 2028-05-21
- recommended_action: ROUTE_TO_DEMAND_LETTER
- contradicting_evidence: empty
- supporting_evidence cites: FNOL Camry-from-behind, Police Report Rivera admission "looking at phone", Witness Patricia Hwang corroboration

### `data/sample_claims/claim_002_slip_fall.json` — AMBIGUOUS

```json
{
  "claim_id": "CLM-2026-00492",
  "line_of_business": "general_liability",
  "state": "WA",
  "fnol_date": "2026-05-24",
  "loss_date": "2026-05-23",
  "paid_amount_usd": 14200,
  "documents": [
    {
      "name": "FNOL Narrative",
      "doc_type": "fnol",
      "text": "Policyholder is Brewline Coffee Roasters, Seattle WA. Customer Elena Park reports she slipped and fell on the floor of the Capitol Hill location on May 23, 2026 around 2:15 PM, sustaining a left wrist fracture and bruising. Park states the floor was wet and she did not see a wet floor sign. Medical treatment at Swedish ED. Initial bill $14,200. Brewline staff state the floor had been mopped by the cleaning service approximately 30 minutes prior. No incident report was filed by Brewline at the time."
    },
    {
      "name": "Initial Witness Statement: Brewline Barista Maya Olsen",
      "doc_type": "witness_statement",
      "text": "I was making drinks when I heard a customer fall near the counter. I went over and helped her sit up. She said her wrist hurt. The floor was a little wet near where she fell. Our cleaners had been in earlier, maybe 30 or 40 minutes before. I don't know if they put out a sign. There usually is a sign but I didn't see one then."
    },
    {
      "name": "Adjuster Notes",
      "doc_type": "adjuster_notes",
      "text": "Spoke with Brewline store manager Devin Wallace. Brewline contracts cleaning to Pacific Cleaning Services (Lynnwood WA). Pacific's contract is on file. Wallace believes Pacific's protocol requires wet floor signage but has no record of who signed off on May 23. No police report was filed. No video footage; the security camera near the counter was non-operational at the time."
    },
    {
      "name": "Medical Record Summary",
      "doc_type": "medical_record",
      "text": "Swedish Capitol Hill ED. Patient: Elena Park, DOB 1989-11-04. Chief complaint: left wrist pain after slip and fall. Imaging: distal radius fracture, non-displaced. Splint applied, ortho follow-up scheduled. Discharge medications: ibuprofen, acetaminophen."
    }
  ]
}
```

**Expected assessment:**
- subrogation_likely: true (with caveats)
- confidence_tier: MEDIUM (0.55 to 0.75)
- third_party.name: Pacific Cleaning Services
- third_party.type: company
- third_party.carrier_or_insurer: unknown (open question)
- estimated_recovery_usd: 14200 (full medical, plus possible future)
- SOL: WA, 3 yrs, expires 2029-05-23
- recommended_action: GATHER_MORE_INFO
- supporting_evidence: FNOL "did not see a wet floor sign", barista statement "I didn't see one then", adjuster notes Pacific Cleaning contract on file
- contradicting_evidence: barista statement "floor was a little wet" but did not directly observe signage, no video footage, no police report
- open_questions: confirm whether Pacific had signage out, obtain Pacific's certificate of insurance, determine whether Brewline's contract with Pacific contains a hold-harmless clause, verify time gap between mop and fall
- reviewer_warnings: comparative negligence possible (WA is pure comparative); need to determine Pacific's coverage before demand letter

### `data/sample_claims/claim_003_dui_defect.json` — FAILURE MODE

```json
{
  "claim_id": "CLM-2026-00510",
  "line_of_business": "personal_auto",
  "state": "CA",
  "fnol_date": "2026-05-26",
  "loss_date": "2026-05-25",
  "paid_amount_usd": 22400,
  "documents": [
    {
      "name": "FNOL Narrative",
      "doc_type": "fnol",
      "text": "Policyholder Daniel Romero reports a single-vehicle accident on Highway 1 near Half Moon Bay, CA on May 25, 2026 at approximately 11:30 PM. Romero states he was driving home and the vehicle 'lost control,' striking the guardrail and totaling the front end. No other vehicle involved. Romero refused field sobriety at scene. Vehicle is a 2023 Toyota Camry."
    },
    {
      "name": "Police Report CHP-2026-44102",
      "doc_type": "police_report",
      "text": "California Highway Patrol Report CHP-2026-44102. Date: May 25, 2026. Time: 23:34. Driver: Daniel Romero. Single-vehicle collision with guardrail. Officer Singh observed slurred speech, odor of alcohol on driver's breath. Driver refused PAS and field sobriety. Driver transported and blood draw performed at San Mateo County hospital. BAC pending. Driver cited for suspected DUI."
    },
    {
      "name": "Adjuster Notes",
      "doc_type": "adjuster_notes",
      "text": "Vehicle towed to Coastside Auto Repair. Initial repair quote $22,400. Shop technician Ramon Diaz noted 'the throttle pedal feels stuck when pressed. Could be a recall issue, have seen similar on this model.' Vehicle is 2023 Toyota Camry. Adjuster has not yet checked NHTSA recall database. Romero's prior driving record: two speeding citations in past three years, no DUI priors."
    }
  ]
}
```

**Expected assessment / desired behavior under failure mode:**
- subrogation_likely: false OR uncertain (low confidence)
- confidence_tier: LOW (< 0.5)
- thesis should reflect that DUI is an intervening cause that likely bars recovery even if a manufacturer defect exists
- third_party.type: should NOT confidently name "Toyota" or "manufacturer" — the throttle-stuck comment is a repair-shop hypothesis without verification, and the DUI dominates the causation analysis
- contradicting_evidence: must include the DUI evidence
- recommended_action: REJECT or DEFER_FOR_HUMAN_JUDGMENT
- open_questions: BAC result pending, NHTSA recall lookup not yet done, repair shop's stuck-throttle observation needs independent inspection
- reviewer_warnings: must explicitly call out that DUI as intervening cause likely bars subrogation against manufacturer in CA, AND that the manufacturer-defect angle is speculative without NHTSA verification

This is the prompt's hard test. If the model confidently identifies Toyota as a subrogation target, it has failed; the workflow handles failure by showing LOW confidence + the contradicting DUI evidence + the speculative warning, and the reviewer rejects it. The demo narrative is "even when the model is tempted to invent a story, the structured output surfaces the contradicting evidence so the reviewer can catch it."

---

## Pre-flagged queue (`data/pre_flagged_queue.json`)

Seed the queue with 4-6 already-assessed claims so the queue isn't empty on first load. Mix of HIGH/MEDIUM/LOW tiers. Each entry is an AuditEntry-shaped object with a model_run event_type and a populated Assessment. Reuse claim_001's assessment for one entry, plus 3-5 synthetic entries (use claim_002 and claim_003 as additional seeds, and invent 1-3 more thin claims with varying confidence and SOL urgency).

Include at least one entry with `statute_of_limitations.expires` within 30 days of today (today is 2026-05-28) so the SOL-urgency UI state is visible without needing to mock anything.

---

## LLM integration (`llm.py`)

```python
import os
import json
from pathlib import Path
from anthropic import Anthropic
from dotenv import load_dotenv
from models import Claim, Assessment

load_dotenv()

MODEL = "claude-sonnet-4-6"   # latest Sonnet; see CLAUDE_MODEL env override
PROMPT_PATH = Path(__file__).parent / "prompts" / "subro_detector.txt"

def get_client() -> Anthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and fill it in.")
    return Anthropic(api_key=api_key)

def load_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")

def format_claim_for_prompt(claim: Claim) -> str:
    """Render the claim as the user message body."""
    docs_section = "\n\n".join(
        f"--- DOCUMENT: {d.name} ({d.doc_type}) ---\n{d.text}"
        for d in claim.documents
    )
    return (
        f"CLAIM METADATA\n"
        f"claim_id: {claim.claim_id}\n"
        f"line_of_business: {claim.line_of_business}\n"
        f"state: {claim.state}\n"
        f"fnol_date: {claim.fnol_date}\n"
        f"loss_date: {claim.loss_date}\n"
        f"paid_amount_usd: {claim.paid_amount_usd}\n\n"
        f"SOURCE DOCUMENTS\n\n{docs_section}\n\n"
        f"Produce the JSON assessment now. JSON only, no preamble."
    )

def assess_claim(claim: Claim) -> tuple[Assessment, str]:
    """Run the model. Returns (assessment, model_version)."""
    client = get_client()
    response = client.messages.create(
        model=os.environ.get("CLAUDE_MODEL", MODEL),
        max_tokens=4000,
        system=load_system_prompt(),
        messages=[{"role": "user", "content": format_claim_for_prompt(claim)}],
    )
    text = response.content[0].text
    # Strip any accidental code fences
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(text)
    return Assessment.model_validate(data), response.model
```

---

## Audit log (`audit.py`)

```python
import json
from pathlib import Path
from datetime import datetime, timezone
from models import AuditEntry

AUDIT_PATH = Path(__file__).parent / "data" / "audit_log.json"

def load_audit_log() -> list[AuditEntry]:
    if not AUDIT_PATH.exists():
        return []
    raw = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    return [AuditEntry.model_validate(item) for item in raw]

def append_audit_entry(entry: AuditEntry) -> None:
    log = load_audit_log()
    log.append(entry)
    AUDIT_PATH.write_text(
        json.dumps([e.model_dump(mode="json") for e in log], indent=2, default=str),
        encoding="utf-8",
    )

def now_utc() -> datetime:
    return datetime.now(timezone.utc)
```

---

## Streamlit app structure (`app.py`)

Use Streamlit's native multipage feature via `st.navigation` or simple sidebar routing. Three pages:

1. **Queue** (default page)
2. **Claim Detail** (parameterized by selected claim_id from session state)
3. **Audit Log**

### Queue page

- Header: title "Subrogation Opportunity Scout" + carrier name "Pursuant Indemnity Mutual" with tagline "Reliable, where applicable." in smaller text below (synthetic; the name and tagline are intentional industry satire, the panel may smile). Show three counters in metric tiles: total flagged, HIGH-confidence count, SOL-within-30-days count.
- A "Drop a new claim" button in the top-right that opens a modal/dialog. The modal has three radio options for the sample claims + a "Run analysis" button.
- Filter row: confidence tier filter (multiselect: HIGH / MEDIUM / LOW), action filter (multiselect of recommended_action), sort by (Recovery $ desc, SOL date asc, Confidence desc).
- The queue is a table or a list of card rows. Each row shows:
  - Confidence tier indicator (colored circle: green / amber / red)
  - Claim ID
  - LOB
  - FNOL date (relative: "6 days ago")
  - Estimated recovery (large, e.g., "$8,500")
  - SOL date with countdown ("expires in 728 days" or "EXPIRES IN 22 DAYS" if urgent, in red)
  - Thesis (one line, truncated to 80 chars)
  - Recommended action badge
  - "Open" link/button → sets session_state.selected_claim_id and navigates to Detail
- Below the queue: a small "Audit log →" link to the audit page.

### Claim Detail page

Three columns (Streamlit `st.columns([0.40, 0.35, 0.25])`):

**Left (40%): Source documents**
- Tabs, one per document. Tab labels: "FNOL", "Police Report", "Witness #1", etc.
- Inside each tab: the raw document text, with the model's cited quotes highlighted (st.markdown with `<mark>` HTML for quote spans). Build this by iterating over supporting_evidence + contradicting_evidence and finding the quote text within each doc.
- A small "Show all evidence" toggle that lists every cited quote in order with its source tag.

**Middle (35%): AI assessment**
- Big confidence badge at top: green HIGH 0.92 / amber MEDIUM 0.62 / red LOW 0.34. Show the numeric confidence next to the tier.
- Thesis in larger font.
- Third-party box: name, type, carrier (with "unknown" rendered in italic muted color if null).
- Estimated recovery: dollar amount in large green text + "basis: [text]" below in small.
- SOL: state, expires date, countdown. Red if <30 days.
- Supporting evidence: numbered list. Each item shows source name + quote (italic) + claim text. Click → switches the left pane to that document's tab and scrolls to the quote.
- Contradicting evidence: same structure, amber/red header.
- Reviewer warnings: amber box, each warning as a bullet.
- Open questions: bulleted list.
- Recommended action: badge.

**Right (25%): Actions + audit**
- Reviewer ID input (default "Molly Shove (Subro Reviewer)") for demo.
- Reviewer notes text area.
- Four action buttons stacked vertically:
  - **Confirm & Route to Demand Letter** (primary, green)
  - Gather More Info (secondary)
  - Reject (red outline)
  - Defer for Senior Review (neutral)
- Below buttons: "Audit trail for this claim" — a small scrollable list of audit entries for this claim_id, newest first. Show timestamp, event type, key fields.

Clicking any action writes an AuditEntry with a ReviewerDecision and refreshes the page back to the queue.

### Audit Log page

- Full audit log, newest first.
- Columns: timestamp (UTC), claim_id, event_type, model_version, reviewer_id, decision/action, confidence (if model_run), notes.
- Download button: "Export audit log (JSON)" + "Export audit log (CSV)".
- Filter: by claim_id and by event_type.

### Drop-a-new-claim flow

When the user clicks "Run analysis" inside the modal:
1. Load the selected sample claim JSON into a Claim model.
2. Write an audit entry with event_type=claim_received.
3. Call `assess_claim(claim)`. Show a spinner ("Model is analyzing...") for the duration.
4. On success, write an audit entry with event_type=model_run, populated Assessment, model_version, prompt_version (compute SHA1 of subro_detector.txt for the version string).
5. Add the result to the queue session state.
6. Navigate to the claim detail page for the new claim.

---

## .env.example

```
# Anthropic API key for the LLM calls. Get from console.anthropic.com.
ANTHROPIC_API_KEY=sk-ant-

# Optional override; defaults to claude-sonnet-4-6
# CLAUDE_MODEL=claude-sonnet-4-6
```

---

## requirements.txt

```
streamlit>=1.32
anthropic>=0.40
pydantic>=2.5
python-dotenv>=1.0
```

---

## README.md content

Sections:
1. **What this is** (1 paragraph: subrogation scout, demo prototype, Invisible interview)
2. **Setup**: clone, create venv, pip install, copy .env.example to .env and add key
3. **Run**: `python -m streamlit run app.py`
4. **The three test cases** (one paragraph each describing what the demo shows)
5. **Architecture** (5-bullet summary: claim in → LLM call with structured prompt → Pydantic-validated assessment → reviewer queue UI → audit log JSON)
6. **What this is NOT** (production-grade, multi-tenant, secure, integrated with Guidewire). Be explicit.
7. **Known limitations**: state SOL list is hardcoded for 9 states; audit log is a file, not a DB; no auth; LLM cost is on the demo runner.

---

## Acceptance criteria

The build is done when:

1. `python -m streamlit run app.py` starts the app cleanly on Molly's machine with an Anthropic API key in `.env`.
2. The queue page shows the 4-6 pre-flagged seeded claims with realistic confidence tiers, recovery amounts, and SOL dates. At least one shows an SOL-urgent state.
3. The "Drop a new claim" modal lets the demo runner pick any of the 3 sample claims, runs a live API call (visible spinner), and the resulting flagged claim appears in the queue within 10 seconds. (Sonnet typical latency is 2-6 seconds.)
4. Opening any claim shows the three-column detail layout with source documents (left), AI assessment (middle), reviewer actions (right). Cited quotes are visibly highlighted in the source documents.
5. Clicking any reviewer action button writes an AuditEntry to `data/audit_log.json` and the audit page shows it.
6. The audit page exports JSON and CSV cleanly.
7. The three test-case behaviors hold:
   - claim_001 (rear-end) → HIGH confidence, ROUTE_TO_DEMAND_LETTER, no contradicting evidence
   - claim_002 (slip-fall) → MEDIUM confidence, GATHER_MORE_INFO, populated open_questions
   - claim_003 (DUI/defect) → LOW confidence, REJECT or DEFER, populated contradicting_evidence and reviewer_warnings
8. The app does not crash if the API key is missing; it shows a friendly error inside the modal instead.
9. The app does not crash if the LLM returns malformed JSON; it catches the JSONDecodeError and shows the raw response in an expander for debugging.
10. No real PII anywhere. All names and policy numbers in test data are obviously synthetic.

---

## Out of scope for this build

- Real Guidewire/Duck Creek integration (mention in README, do not attempt)
- Multi-user / RBAC
- Persistent DB (file-based audit log is fine)
- Test suite (manual verification only)
- CSS styling beyond Streamlit defaults + the per-state color accents (green/amber/red, SOL urgency red border)
- Streaming the LLM response (single-shot is fine for the demo)
- Retries on transient API errors (one attempt, friendly error on failure)

---

## Build order for Claude Code

Suggested order so the build is incrementally runnable:

1. Repo scaffolding + requirements.txt + .env.example + README skeleton
2. `models.py` — all Pydantic dataclasses
3. `prompts/subro_detector.txt` — paste the system prompt verbatim from this spec
4. `data/sample_claims/*.json` — three test cases verbatim from this spec
5. `data/pre_flagged_queue.json` — synthetic seed entries; invent 1-3 thin claims to round out the queue
6. `llm.py` — Anthropic client, prompt assembly, assess_claim function
7. `audit.py` — read/write audit log
8. `app.py` Queue page only (skip the LLM call for now, just render seeded data)
9. `app.py` Claim Detail page
10. `app.py` Audit Log page
11. W