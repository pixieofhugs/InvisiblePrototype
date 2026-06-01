"""FastAPI backend for the Subrogation Opportunity Scout.

Serves the zero-build React front-end from web/ (same origin -> no CORS) and exposes
a small JSON API. "Drop a claim" runs a real Anthropic call on one of the spec's
sample claims and reshapes the result for the UI; if the API key is missing or the
call fails, it falls back to the canned mock template.

Run:  python -m uvicorn app:app --port 8000 --workers 1
"""

from __future__ import annotations

import asyncio
import copy
import json
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import llm
import store
from models import Claim
from reshape import assessment_to_claim

log = logging.getLogger("subro")

ROOT = Path(__file__).parent
WEB_DIR = ROOT / "web"
TEMPLATES_SEED = ROOT / "data" / "seed" / "templates_seed.json"

# drop-a-claim template key -> spec sample claim file (full document text)
TEMPLATE_TO_SAMPLE = {
    "straightforward": "claim_001_rear_end.json",
    "ambiguous": "claim_002_slip_fall.json",
    "failure": "claim_003_dui_defect.json",
}

# Simulated "thinking" latency so the spinner reads like a real model run.
SIMULATED_LATENCY_S = 1.4

_templates = json.loads(TEMPLATES_SEED.read_text(encoding="utf-8"))

app = FastAPI(title="Subrogation Opportunity Scout")


# ---- request bodies -------------------------------------------------------

class AnalyzeBody(BaseModel):
    template: str


class ActionBody(BaseModel):
    decision: str
    notes: str = ""
    reviewerName: str = "Molly Shove"


class UndoBody(BaseModel):
    reviewerName: str = "Molly Shove"


# ---- API routes (registered before the static mount) ----------------------

@app.get("/api/state")
def api_state():
    return store.get_state()


@app.post("/api/analyze")
async def api_analyze(body: AnalyzeBody):
    template = body.template
    if template not in TEMPLATE_TO_SAMPLE:
        raise HTTPException(status_code=400, detail=f"Unknown template '{template}'")

    sample_path = ROOT / "data" / "sample_claims" / TEMPLATE_TO_SAMPLE[template]
    claim = Claim.model_validate_json(sample_path.read_text(encoding="utf-8"))
    new_id = store.next_claim_id()
    warning: str | None = None

    # Prefer a LIVE Anthropic call when a key is configured; on any failure (or no key),
    # fall back to the deterministic simulated assessment so the demo never breaks.
    if llm.has_api_key():
        try:
            assessment, model_version = await asyncio.to_thread(llm.assess_claim, claim)
            source = "live"
        except Exception as exc:
            log.exception("Live assessment failed; falling back to simulated")
            await asyncio.sleep(SIMULATED_LATENCY_S)
            assessment, model_version = llm.simulate_assessment(template)
            source = "simulated"
            warning = f"Live model call failed ({type(exc).__name__}); showing a simulated assessment."
    else:
        # No key: simulate, with a short non-blocking delay so the spinner reads naturally.
        await asyncio.sleep(SIMULATED_LATENCY_S)
        assessment, model_version = llm.simulate_assessment(template)
        source = "simulated"

    try:
        claim_dict = assessment_to_claim(
            claim, assessment,
            model_version=model_version, now=store.now_utc(),
            claim_id_override=new_id,
        )
    except Exception as exc:  # extremely defensive — reshape should not fail on validated data
        log.exception("Reshape failed; falling back to seed template")
        claim_dict = copy.deepcopy(_templates[template])
        claim_dict["id"] = new_id
        claim_dict["fnolRelative"] = "Just now"
        model_version = "seed-template"
        warning = f"Reshape failed ({type(exc).__name__}); used the seed template."

    store.add_claim(claim_dict, model_version=model_version, source=source)
    return {"claim": claim_dict, "source": source, "warning": warning}


@app.post("/api/claims/{claim_id}/action")
def api_action(claim_id: str, body: ActionBody):
    try:
        return store.apply_action(claim_id, body.decision, body.notes, body.reviewerName)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")


@app.post("/api/claims/{claim_id}/undo")
def api_undo(claim_id: str, body: UndoBody | None = None):
    reviewer = body.reviewerName if body else "Molly Shove"
    try:
        return store.undo_action(claim_id, reviewer)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")


@app.post("/api/reset")
def api_reset():
    return store.reset()


@app.get("/api/health")
def api_health():
    return JSONResponse({
        "ok": True,
        "model": llm.model_name(),
        "mode": "live" if llm.has_api_key() else "simulated",
    })


# ---- static front-end (catch-all; must be mounted last) -------------------

@app.get("/")
def index():
    return FileResponse(WEB_DIR / "Prototype.html")


app.mount("/", StaticFiles(directory=str(WEB_DIR), html=True), name="static")
