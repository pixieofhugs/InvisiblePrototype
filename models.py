"""Pydantic v2 data models for the Subrogation Opportunity Scout.

Ported verbatim from prototype-code-spec.md. These describe the LLM contract:
the raw `Claim` we send to the model and the structured `Assessment` it returns.

Note: the *front-end* claim object (rendered by the React queue/detail panes) is a
richer, different shape. It is NOT a Pydantic model — it is produced by
`reshape.assessment_to_claim()` and stored/served as an opaque dict.
"""

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
    prompt_version: Optional[str] = None         # SHA or version string
    assessment: Optional[Assessment] = None
    reviewer_decision: Optional[ReviewerDecision] = None
    notes: Optional[str] = None
