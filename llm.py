"""Model layer for the Subrogation Opportunity Scout.

"Drop a new claim" prefers a LIVE Anthropic call when an API key is available, and
falls back to a deterministic, pre-written (simulated) assessment otherwise:

- live   : real Claude call -> validated Assessment            (assess_claim)
- sim     : canned Assessment per sample claim, no network      (simulate_assessment)

Either way the result is a validated `Assessment` that the reshape pipeline turns into
the rich front-end claim (with verbatim-quote highlights). The system prompt SHA is
stamped into the audit log as the prompt version.
"""

import os
import json
import hashlib
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

from models import Claim, Assessment

load_dotenv()

MODEL = "claude-sonnet-4-6"   # latest Sonnet; overridable via CLAUDE_MODEL
PROMPT_PATH = Path(__file__).parent / "prompts" / "subro_detector.txt"
CANNED_DIR = Path(__file__).parent / "data" / "canned_assessments"
REQUEST_TIMEOUT_S = 30.0


def model_name() -> str:
    return os.environ.get("CLAUDE_MODEL", MODEL)


def has_api_key() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


@lru_cache(maxsize=1)
def load_system_prompt() -> str:
    # cached: the prompt file doesn't change at runtime, so we read it once.
    return PROMPT_PATH.read_text(encoding="utf-8")


@lru_cache(maxsize=1)
def prompt_version() -> str:
    """Short SHA1 of the system prompt — stamped into the audit log."""
    digest = hashlib.sha1(load_system_prompt().encode("utf-8")).hexdigest()
    return "sha1:" + digest[:12]


# ---- live Anthropic call --------------------------------------------------

def _get_client():
    from anthropic import Anthropic  # imported lazily so the app runs without the SDK
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set.")
    return Anthropic(api_key=api_key)


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


def _extract_text(response) -> str:
    for block in response.content:
        if getattr(block, "type", None) == "text":
            return block.text
    return getattr(response.content[0], "text", "")


def assess_claim(claim: Claim) -> tuple[Assessment, str]:
    """LIVE: call Claude and validate its JSON. Returns (assessment, model_version).

    Raises on any failure (missing key, network, malformed JSON, validation) so the
    caller can fall back to the simulated assessment.
    """
    client = _get_client()
    response = client.messages.create(
        model=model_name(),
        max_tokens=4000,
        system=load_system_prompt(),
        messages=[{"role": "user", "content": format_claim_for_prompt(claim)}],
        timeout=REQUEST_TIMEOUT_S,
    )
    text = _extract_text(response).strip()
    text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(text)
    return Assessment.model_validate(data), response.model


# ---- simulated (canned) assessment ----------------------------------------

def simulate_assessment(template_key: str) -> tuple[Assessment, str]:
    """SIMULATED: load the canned assessment for a sample claim. No network."""
    path = CANNED_DIR / f"{template_key}.json"
    if not path.exists():
        raise KeyError(f"No canned assessment for template '{template_key}'")
    data = json.loads(path.read_text(encoding="utf-8"))
    return Assessment.model_validate(data), f"{model_name()} (simulated)"
