"""Backend-owned demo state: the queue of front-end claim dicts + the global audit log.

Seeds from data/seed/ on first run, persists to data/state/ on every mutation
(atomic tmp-file + os.replace), and guards mutate+persist with a lock. The stored
claim shapes ARE the front-end dicts, so GET /api/state returns them untouched.

Mutation helpers mirror the prototype's App handlers (Prototype.html) field-for-field
so behavior is identical whether state lives in the browser or on disk.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import threading
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent
SEED_DIR = ROOT / "data" / "seed"
STATE_DIR = ROOT / "data" / "state"
CLAIMS_STATE = STATE_DIR / "claims.json"
AUDIT_STATE = STATE_DIR / "audit_log.json"
CLAIMS_SEED = SEED_DIR / "claims_seed.json"
AUDIT_SEED = SEED_DIR / "audit_seed.json"

_LOCK = threading.Lock()
_claims: list[dict] | None = None
_audit: list[dict] | None = None

# decision key (from the ActionsPane) -> human label (matches App.handleAction)
DECISION_LABEL = {
    "confirmed": "CONFIRMED — ROUTED TO DEMAND LETTER",
    "rejected": "REJECTED",
    "deferred": "DEFERRED FOR SENIOR REVIEW",
    "gather": "GATHER MORE INFO REQUESTED",
}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _ts(now: datetime) -> str:
    return now.strftime("%Y-%m-%d %H:%M UTC")


def _read_json(path: Path) -> list:
    return json.loads(path.read_text(encoding="utf-8"))


def _atomic_write(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, path)  # atomic on same volume (Windows + POSIX)


def _ensure_loaded() -> None:
    """Load state into memory, seeding from data/seed/ on first run."""
    global _claims, _audit
    if _claims is not None and _audit is not None:
        return
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    if not CLAIMS_STATE.exists():
        shutil.copyfile(CLAIMS_SEED, CLAIMS_STATE)
    if not AUDIT_STATE.exists():
        shutil.copyfile(AUDIT_SEED, AUDIT_STATE)
    _claims = _read_json(CLAIMS_STATE)
    _audit = _read_json(AUDIT_STATE)


def _persist() -> None:
    _atomic_write(CLAIMS_STATE, _claims)
    _atomic_write(AUDIT_STATE, _audit)


# ---- public API -----------------------------------------------------------

def get_state() -> dict:
    with _LOCK:
        _ensure_loaded()
        return {"claims": _claims, "auditLog": _audit}


def next_claim_id() -> str:
    """Allocate a fresh CLM-YYYY-NNNNN id above every existing claim/audit id."""
    with _LOCK:
        _ensure_loaded()
        year, best = 2026, 0
        pat = re.compile(r"CLM-(\d{4})-(\d+)")
        ids = [c.get("id", "") for c in _claims] + [r.get("claimId", "") for r in _audit]
        for cid in ids:
            m = pat.fullmatch(str(cid))
            if m:
                n = int(m.group(2))
                if n > best:
                    best, year = n, int(m.group(1))
        return f"CLM-{year}-{best + 1:05d}"


def add_claim(claim: dict, *, model_version: str, source: str) -> dict:
    """Prepend a freshly-analyzed claim + its two global audit rows (mirrors App.addClaim)."""
    from reshape import ACTION_LABEL  # local import to avoid a cycle at module load
    with _LOCK:
        _ensure_loaded()
        now = now_utc()
        ts = _ts(now)
        _claims.insert(0, claim)
        action_label = ACTION_LABEL.get(claim.get("action", ""), claim.get("action", ""))
        note = {"live": "live model run", "simulated": "simulated model run"}.get(source, f"{source} assessment")
        _audit.insert(0, {
            "ts": ts, "claimId": claim["id"], "type": "model_run",
            "modelVersion": model_version, "reviewer": "",
            "action": action_label, "confidence": claim.get("confidence"), "notes": note,
        })
        _audit.insert(1, {
            "ts": ts, "claimId": claim["id"], "type": "claim_received",
            "modelVersion": "", "reviewer": "",
            "action": "FNOL submitted", "confidence": None, "notes": "",
        })
        _persist()
        return {"claims": _claims, "auditLog": _audit}


def _find(claim_id: str) -> dict | None:
    for c in _claims:
        if c.get("id") == claim_id:
            return c
    return None


def apply_action(claim_id: str, decision: str, notes: str, reviewer_name: str) -> dict:
    """Record a reviewer decision (mirrors App.handleAction)."""
    with _LOCK:
        _ensure_loaded()
        claim = _find(claim_id)
        if claim is None:
            raise KeyError(claim_id)
        now = now_utc()
        ts = _ts(now)
        label = DECISION_LABEL.get(decision, "GATHER MORE INFO REQUESTED")
        claim["status"] = decision
        claim.setdefault("auditTrail", []).append({
            "ts": ts, "type": "reviewer_action", "reviewer": reviewer_name,
            "decision": label, "notes": notes,
        })
        _audit.insert(0, {
            "ts": ts, "claimId": claim_id, "type": "reviewer_action",
            "modelVersion": "", "reviewer": reviewer_name,
            "action": label, "confidence": None, "notes": notes,
        })
        _persist()
        return {"claim": claim, "auditLog": _audit}


def undo_action(claim_id: str, reviewer_name: str = "Molly Shove") -> dict:
    """Revert a claim to pending (mirrors App.handleUndoAction)."""
    with _LOCK:
        _ensure_loaded()
        claim = _find(claim_id)
        if claim is None:
            raise KeyError(claim_id)
        now = now_utc()
        ts = _ts(now)
        claim["status"] = "pending"
        claim.setdefault("auditTrail", []).append({
            "ts": ts, "type": "reviewer_action", "reviewer": reviewer_name,
            "decision": "DECISION REVERSED — awaiting new assessment", "notes": "",
        })
        _audit.insert(0, {
            "ts": ts, "claimId": claim_id, "type": "reviewer_action",
            "modelVersion": "", "reviewer": reviewer_name,
            "action": "DECISION REVERSED", "confidence": None,
            "notes": "Reviewer changed assessment.",
        })
        _persist()
        return {"claim": claim, "auditLog": _audit}


def reset() -> dict:
    """Restore the clean seeded state (re-copy seeds over the live state files)."""
    global _claims, _audit
    with _LOCK:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(CLAIMS_SEED, CLAIMS_STATE)
        shutil.copyfile(AUDIT_SEED, AUDIT_STATE)
        _claims = _read_json(CLAIMS_STATE)
        _audit = _read_json(AUDIT_STATE)
        return {"claims": _claims, "auditLog": _audit}
