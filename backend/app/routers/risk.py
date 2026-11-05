# ============================================================
# SHIFTShield 2.0 — Risk Engine Router
# POST /api/risk/assess
# GET  /api/risk/history
#
# Delegates to services/risk_engine.py for all scoring logic.
# Supabase persistence is best-effort (no-op in DEMO_MODE).
# ============================================================

from fastapi import APIRouter
from app.config import settings
from app.models.schemas import RiskAssessRequest, RiskAssessResponse
from app.services.risk_engine import run_risk_engine, persist_risk_assessment, fetch_risk_history
import uuid

router = APIRouter()


@router.post(
    "/risk/assess",
    summary="Generate an estimated heat exposure risk assessment",
    response_model=RiskAssessResponse,
)
def assess_risk(req: RiskAssessRequest):
    """
    Generates an explainable, deterministic heat exposure concern assessment.

    **This is NOT a WBGT measurement.** It is an Estimated Heat Exposure Concern
    based on environmental and occupational workload inputs.

    Each contributing factor is returned with a human-readable explanation
    so supervisors can understand exactly why a risk level was assigned.

    The full disclaimer is included in every response.
    """
    result = run_risk_engine(req)

    # Persist to Supabase (best-effort — no-op if DEMO_MODE or DB unavailable)
    assessment_id = persist_risk_assessment(result, req)
    if assessment_id is None:
        # Demo mode or no DB: generate a stable ID
        assessment_id = f"ra-{uuid.uuid4().hex[:12]}"

    return RiskAssessResponse(
        id=assessment_id,
        workplace_id=req.workplace_id or "wp-001",
        workload=req.workload,
        exposure_mins=req.duration_mins,
        **result,
    )


@router.get(
    "/risk/history",
    summary="Get recent risk assessments",
)
def get_risk_history(
    workplace_id: str = "wp-001",
    limit: int = 10,
):
    """
    Returns the most recent risk assessments for a workplace.
    Falls back to demo fixture if database is unavailable.
    """
    return fetch_risk_history(workplace_id=workplace_id, limit=limit)
