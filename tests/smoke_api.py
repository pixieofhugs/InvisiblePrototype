"""Manual backend smoke test (no live key needed). Run: python tests/smoke_api.py

Exercises the SIMULATED path in an ISOLATED state dir, so it never makes a live API
call and never touches a running server's data/state.
"""
import os
import sys
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# Isolate state to a throwaway dir BEFORE importing the app (store reads SUBRO_STATE_DIR
# at import time), so we never delete/clobber a running server's live state.
_tmp_state = Path(tempfile.mkdtemp(prefix="subro_smoke_state_"))
os.environ["SUBRO_STATE_DIR"] = str(_tmp_state)

from fastapi.testclient import TestClient  # noqa: E402
import llm  # noqa: E402
import app as app_module  # noqa: E402

# Force the simulated path. load_dotenv() in llm re-reads any real key from .env, so
# popping the env var isn't enough — patch has_api_key directly.
llm.has_api_key = lambda: False

client = TestClient(app_module.app)


def check(label, cond):
    print(f"  [{'PASS' if cond else 'FAIL'}] {label}")
    if not cond:
        check.failed = True


check.failed = False

print("GET /api/state (cold start)")
state = client.get("/api/state").json()
check("8 seeded claims", len(state["claims"]) == 8)
check("15 seeded audit rows", len(state["auditLog"]) == 15)
check("has an ERROR claim", any(c.get("tier") == "ERROR" for c in state["claims"]))
check("has a confirmed claim", any(c.get("status") == "confirmed" for c in state["claims"]))
check("has an SOL-urgent claim", any(c.get("solUrgent") for c in state["claims"]))

print("POST /api/analyze (simulated)")
r = client.post("/api/analyze", json={"template": "failure"}).json()
check("source is simulated", r["source"] == "simulated")
check("no warning on success", r.get("warning") is None)
claim = r["claim"]
check("failure -> LOW / REJECT", claim["tier"] == "LOW" and claim["action"] == "REJECT")
check("contradicting evidence present (DUI)", len(claim["contradicting"]) >= 1)
check("warnings populated", len(claim["warnings"]) >= 1)
# highlights landed: at least one cv span in the documents
cv_spans = [p for d in claim["docs"].values() for p in d["parts"] if p["t"] == "cv"]
check("contradicting highlights landed in docs", len(cv_spans) >= 1)
new_id = claim["id"]
check("fresh id allocated (>=00493)", new_id.startswith("CLM-") and int(new_id.split("-")[-1]) >= 493)
check("fnolRelative reset", r["claim"]["fnolRelative"] == "Just now")
state2 = client.get("/api/state").json()
check("claim prepended", state2["claims"][0]["id"] == new_id)
check("2 audit rows added", len(state2["auditLog"]) == 17)

print("POST action -> confirm")
ra = client.post(f"/api/claims/{new_id}/action",
                 json={"decision": "confirmed", "notes": "looks clean", "reviewerName": "Molly Shove"}).json()
check("status confirmed", ra["claim"]["status"] == "confirmed")
check("reviewer_action in audit", ra["auditLog"][0]["type"] == "reviewer_action")

print("POST undo")
ru = client.post(f"/api/claims/{new_id}/undo", json={"reviewerName": "Molly Shove"}).json()
check("status pending", ru["claim"]["status"] == "pending")

print("persistence: files written")
check("claims.json exists", (_tmp_state / "claims.json").exists())
check("audit_log.json exists", (_tmp_state / "audit_log.json").exists())

print("POST /api/reset")
rr = client.post("/api/reset").json()
check("reset to 8 claims", len(rr["claims"]) == 8)
check("reset to 15 audit rows", len(rr["auditLog"]) == 15)

print("GET / serves the app")
root = client.get("/")
check("index served", root.status_code == 200 and "Subrogation Opportunity Scout" in root.text)

print("\nRESULT:", "FAILED" if check.failed else "ALL PASS")
shutil.rmtree(_tmp_state, ignore_errors=True)  # teardown: remove the throwaway state dir
sys.exit(1 if check.failed else 0)
