# Subrogation Opportunity Scout

An AI-assisted claim-review prototype for P&C insurance **subrogation** investigators
at the (fictional) carrier **Pursuant Indemnity Mutual**. Claude analyzes an incoming
claim for subrogation opportunity, scores it with a calibrated confidence, cites
verbatim evidence from the source documents, and recommends an action. A human
reviewer then confirms, rejects, defers, or requests more info — and every step is
written to an audit log. Built as a demo prototype for an Invisible interview.

This implementation pairs the **pixel-perfect React prototype** (from the design
handoff) with a **thin FastAPI backend** that runs a real Anthropic call on "Drop a
new claim" and persists state to disk.

## Setup

```powershell
# 1. Create a virtualenv and install deps
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# 2. Add your Anthropic key (optional — without it, drops use a canned assessment)
copy .env.example .env
#   then edit .env and set ANTHROPIC_API_KEY=sk-ant-...
```

## Run

```powershell
.\.venv\Scripts\python.exe -m uvicorn app:app --port 8000 --workers 1
```

Then open <http://localhost:8000>. The FastAPI server serves both the React front-end
(`web/`) and the JSON API from the same origin, so there's no CORS setup.

## The three test cases ("Drop a new claim")

The modal runs a **live** model call on one of three sample claims (full document
text in `data/sample_claims/`) and reshapes the structured result into the queue UI:

- **Straightforward** (rear-end, OR) — a named third party who admitted fault, with
  corroborating police report and witness. Expect **HIGH** confidence and
  **Route to Demand Letter**, no contradicting evidence.
- **Ambiguous** (slip-and-fall, WA) — a plausible contractor target that can't yet be
  named or insured. Expect **MEDIUM** confidence and **Gather More Info**, with
  populated open questions.
- **Failure mode** (single-vehicle DUI, CA) — a repair-shop "stuck throttle" remark
  the model is tempted to pin on the manufacturer. The point of the demo is that the
  structured output surfaces the **DUI as contradicting evidence** and stays **LOW**
  confidence so the reviewer can reject it. If the model confidently blames Toyota, it
  has failed the test.

If no API key is set (or the call fails), the drop falls back to a deterministic
canned assessment. The audit log labels each run honestly — `live model run` vs
`simulated model run` — so it's never misleading.

## Architecture

- **Claim in** → `data/sample_claims/*.json` (raw FNOL + police/witness/adjuster docs).
- **LLM call** → `llm.py` assembles the system prompt (`prompts/subro_detector.txt`)
  + claim and asks Claude for a single JSON object.
- **Validation** → `models.py` (Pydantic v2) validates the model's `Assessment`.
- **Reshape** → `reshape.py` maps the flat assessment into the rich front-end claim,
  **locating each verbatim quote** inside its document to build the inline `ev`/`cv`
  highlight spans (the reviewer can ctrl-F every highlight).
- **Reviewer queue + audit** → `store.py` owns the queue and audit log, persisting to
  `data/state/*.json`; `app.py` exposes `/api/*`; the React panes in `web/` render it.

## Model

Defaults to `claude-sonnet-4-6` (fast, ~2-6s). Override at runtime with the
`CLAUDE_MODEL` env var (e.g. `claude-opus-4-8`) to demo a different model.

## What this is NOT

A production system. There is no real Guidewire / Duck Creek integration, no
multi-tenant or RBAC, no database, no authentication, and no document storage —
documents are static JSON. Do not point this at real claims or real PII.

## Known limitations

- The state SOL list in the system prompt is hardcoded for 9 states.
- The audit log is a JSON file (`data/state/audit_log.json`), not a tamper-evident DB.
- Single user, local-only, no auth.
- LLM cost for live drops is on whoever runs the demo.
- The front-end loads React/Babel from a CDN (so it needs internet — as does the live
  model call); a "Reset demo" button restores the clean seeded state between runs.

## Project layout

```
app.py                # FastAPI: /api/* + serves web/
models.py             # Pydantic v2 models (the LLM contract)
llm.py                # Anthropic wrapper + prompt assembly
reshape.py            # flat Assessment -> rich front-end claim + quote highlighting
store.py              # seed/persist/reset of claims + audit log
prompts/              # system prompt
data/sample_claims/   # the 3 live drop-a-claim inputs (full document text)
data/seed/            # queue/audit seed (converted from the design's data.js)
data/state/           # live persisted state (gitignored)
web/                  # the zero-build React app (Prototype.html + *.jsx + api.js)
scripts/convert_seed.js   # build-time data.js -> seed JSON
tests/                # reshape unit tests + backend smoke test
```
