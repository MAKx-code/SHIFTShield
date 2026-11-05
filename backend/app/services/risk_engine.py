# ============================================================
# SHIFTShield 2.0 — Risk Engine Service
#
# IMPORTANT DISCLAIMER:
# This engine produces an "Estimated Heat Exposure Concern"
# rating. It is NOT a medically validated occupational health
# measurement. It does NOT calculate WBGT (Wet Bulb Globe
# Temperature) or any other clinically recognised index.
#
# The scoring rules are based on reasonable occupational
# health principles (high temperature + high humidity +
# physical exertion = increased heat stress risk) but should
# be used as a decision-support tool ONLY, alongside:
#   - Qualified occupational health guidance
#   - Your organisation's heat management policy
#   - Actual workplace measurements where available
#
# Risk levels: low | moderate | elevated | high
# ============================================================

from datetime import datetime
from typing import Optional
from app.models.schemas import (
    RiskAssessRequest, RiskAssessResponse, RiskLevel, Workload, Environment
)

# ---- Public disclaimer text (included in every response) ---

DISCLAIMER = (
    "This assessment is an Estimated Heat Exposure Concern based on environmental and workload inputs. "
    "It is NOT a medically validated measurement (such as WBGT — Wet Bulb Globe Temperature). "
    "Risk levels should be used as a decision-support tool alongside qualified occupational health "
    "guidance and your organisation's site-specific heat management policy. "
    "Environmental data sourced from Open-Meteo standard meteorological measurements — "
    "not from workplace WBGT instruments."
)

# ---- Risk level thresholds ----------------------------------
#
# Score → Level mapping (additive, capped at 6.0):
#   0.0 – 0.9  → low
#   1.0 – 2.4  → moderate
#   2.5 – 3.9  → elevated
#   4.0+       → high
#
# Each modifier adds or subtracts from this score.
# The score is intentionally simple and transparent so
# every factor is fully traceable to the output.

_SCORE_THRESHOLDS = [
    ("high",     4.0),
    ("elevated", 2.5),
    ("moderate", 1.0),
    ("low",      0.0),
]


def _score_to_level(score: float) -> RiskLevel:
    for level, threshold in _SCORE_THRESHOLDS:
        if score >= threshold:
            return level  # type: ignore[return-value]
    return "low"


# ---- Recommendations by risk level -------------------------

_RECOMMENDATIONS: dict[str, list[str]] = {
    "low": [
        "Maintain regular hydration — drink water before feeling thirsty.",
        "Continue standard heat monitoring at scheduled intervals.",
        "Ensure workers know how to report heat discomfort.",
    ],
    "moderate": [
        "Consider rescheduling heavy outdoor tasks to before 9:00 AM or after 4:00 PM.",
        "Ensure shaded recovery areas are accessible within reasonable distance of work zones.",
        "Workers should take short rest breaks (5–10 min) at least once per hour.",
        "Increase water availability — workers should drink approximately 250 ml every 20 minutes.",
    ],
    "elevated": [
        "Review all planned outdoor work. Reschedule heavy or very heavy tasks to cooler periods of the day.",
        "Implement mandatory recovery breaks every 30–45 minutes for all outdoor workers.",
        "Confirm shaded recovery areas are set up and accessible near active work zones.",
        "Increase water stations — workers should drink 250–500 ml every 15–20 minutes.",
        "Supervisors should actively check on outdoor workers at least every 30 minutes.",
        "Brief all workers on heat stress warning signs: dizziness, nausea, heavy sweating, confusion.",
    ],
    "high": [
        "STOP all very heavy and heavy outdoor tasks immediately. Do not resume without supervisor review.",
        "Mandatory recovery breaks every 20–30 minutes. No worker should continue without hydration.",
        "Activate your site heat management protocol. Consider suspending all non-essential outdoor activity.",
        "All supervisors must visually monitor outdoor workers continuously.",
        "Ensure first aid resources are immediately accessible on site.",
        "Workers must be briefed on emergency procedures. Report any symptoms immediately.",
        "Consider contacting your occupational health advisor if high-risk conditions persist.",
    ],
}

_BASE_RECOMMENDATIONS = [
    "Ensure drinking water is accessible within 50 metres of all active work areas.",
    "Monitor workers for signs of heat stress: dizziness, nausea, heavy sweating, headache, confusion.",
    "Follow your site's heat illness emergency response protocol immediately if symptoms are reported.",
]


# ============================================================
# Main Risk Engine Function
# ============================================================

def run_risk_engine(req: RiskAssessRequest) -> dict:
    """
    Deterministic, explainable occupational heat exposure concern assessment.

    Each modifier is independently scored and recorded as a contributing factor.
    The output is fully traceable: every factor maps to a specific score increment.

    Args:
        req: RiskAssessRequest with temperature, humidity, workload,
             duration_mins, environment, and optional acclimatisation_days.

    Returns:
        dict with risk_level, contributing_factors, recommendations,
        explanation, data_source, disclaimer, and assessed_at.
    """
    score = 0.0
    factors: list[str] = []

    # ---- 1. Temperature base score -------------------------
    # Rationale: Higher ambient temperatures directly increase
    # physiological heat load on workers.
    if req.temperature >= 38:
        score += 3.0
        factors.append(
            f"Very high environmental temperature ({req.temperature}\u00b0C) — "
            "substantially increases metabolic heat load"
        )
    elif req.temperature >= 35:
        score += 2.0
        factors.append(
            f"High environmental temperature ({req.temperature}\u00b0C) — "
            "significantly reduces the body's ability to dissipate heat"
        )
    elif req.temperature >= 32:
        score += 1.0
        factors.append(
            f"Elevated environmental temperature ({req.temperature}\u00b0C) — "
            "increases heat stress risk for physical work"
        )
    elif req.temperature >= 28:
        score += 0.5
        factors.append(
            f"Warm environmental temperature ({req.temperature}\u00b0C) — "
            "mild contribution to heat load, especially with physical exertion"
        )
    # Below 28°C: no temperature contribution

    # ---- 2. Humidity modifier ------------------------------
    # Rationale: High relative humidity impairs sweat evaporation,
    # which is the primary cooling mechanism for the human body.
    if req.humidity >= 75:
        score += 1.0
        factors.append(
            f"Very high relative humidity ({req.humidity:.0f}%) — "
            "severely impairs evaporative cooling (sweat evaporation)"
        )
    elif req.humidity >= 65:
        score += 0.5
        factors.append(
            f"Elevated relative humidity ({req.humidity:.0f}%) — "
            "reduces effectiveness of evaporative cooling"
        )
    # Below 65%: no significant humidity contribution

    # ---- 3. Environment modifier ---------------------------
    # Rationale: Direct solar radiation adds significant radiant
    # heat load beyond air temperature alone.
    if req.environment == "outdoor_sun":
        score += 1.0
        factors.append(
            "Direct sun exposure (outdoor, unshaded) — "
            "solar radiation adds significant radiant heat load beyond air temperature"
        )
    elif req.environment == "outdoor_shade":
        # Neutral — some benefit from shade but still outdoor conditions
        pass
    elif req.environment == "indoor":
        score -= 0.5
        # Negative factor not listed (absence of sun is a positive, not a named risk)

    # ---- 4. Workload modifier ------------------------------
    # Rationale: Physical work generates internal body heat (metabolic heat).
    # Higher workload = more internal heat generation.
    if req.workload == "very_heavy":
        score += 1.5
        factors.append(
            "Very heavy physical workload — "
            "high metabolic heat generation significantly increases core body temperature risk"
        )
    elif req.workload == "heavy":
        score += 0.75
        factors.append(
            "Heavy physical workload — "
            "elevated metabolic heat generation increases core temperature risk"
        )
    elif req.workload == "moderate":
        score += 0.25
        # Moderate workload: minor contribution, not listed as a named factor
    # Light workload: slight benefit (no factor listed, minor negative score)
    elif req.workload == "light":
        score -= 0.25

    # ---- 5. Duration modifier ------------------------------
    # Rationale: Cumulative heat exposure increases core body temperature
    # over time. Longer durations without recovery = higher risk.
    if req.duration_mins > 120:
        score += 1.0
        factors.append(
            f"Extended continuous exposure duration ({req.duration_mins} minutes) — "
            "cumulative heat load increases without recovery opportunity"
        )
    elif req.duration_mins > 90:
        score += 0.5
        factors.append(
            f"Prolonged exposure duration ({req.duration_mins} minutes) — "
            "sustained heat load without recovery increases cumulative risk"
        )
    # Under 90 min: no duration contribution

    # ---- 6. Acclimatisation modifier -----------------------
    # Rationale: Workers new to heat (< 5 days) have not yet
    # developed the physiological adaptations that reduce heat stress.
    if req.acclimatisation_days is not None and req.acclimatisation_days < 5:
        score += 0.5
        factors.append(
            f"Limited heat acclimatisation ({req.acclimatisation_days} day"
            f"{'s' if req.acclimatisation_days != 1 else ''}) — "
            "workers new to heat have not yet developed full physiological heat tolerance"
        )

    # ---- Clamp and classify --------------------------------
    score = max(0.0, min(score, 6.0))
    risk_level: RiskLevel = _score_to_level(score)

    # ---- Build explanation ---------------------------------
    if factors:
        primary = factors[0].split(" — ")[0]  # Short name for first factor
        explanation_parts = [
            f"Current conditions present a {risk_level.upper()} estimated heat exposure concern. "
        ]
        if len(factors) == 1:
            explanation_parts.append(
                f"The primary contributing factor is: {primary}."
            )
        else:
            others = [f.split(" — ")[0] for f in factors[1:3]]
            explanation_parts.append(
                f"Primary factor: {primary}. "
                f"Additional contributing factors: {', '.join(others)}."
            )
            if len(factors) > 3:
                extra = [f.split(" — ")[0] for f in factors[3:]]
                explanation_parts.append(f" Further factors: {', '.join(extra)}.")

        explanation_parts.append(
            f" Assessment score: {score:.1f}/6.0 (low < 1.0, moderate 1.0–2.4, elevated 2.5–3.9, high 4.0+). "
            "This is an estimated concern — not a WBGT measurement."
        )
        explanation = "".join(explanation_parts)
    else:
        explanation = (
            f"Current conditions present a LOW estimated heat exposure concern. "
            f"No significant heat stress risk factors identified at these inputs. "
            f"Assessment score: {score:.1f}/6.0. "
            "Continue standard monitoring."
        )

    # ---- Assemble recommendations -------------------------
    recommendations = _RECOMMENDATIONS.get(risk_level, []) + _BASE_RECOMMENDATIONS

    return {
        "risk_level": risk_level,
        "contributing_factors": factors if factors else ["No significant heat risk factors identified at these inputs"],
        "recommendations": recommendations,
        "explanation": explanation,
        "data_source": "SHIFTShield deterministic risk engine (v1.0) — inputs provided by user",
        "disclaimer": DISCLAIMER,
        "assessed_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


# ============================================================
# Supabase Persistence
# ============================================================

def persist_risk_assessment(
    result: dict,
    req: RiskAssessRequest,
    reading_id: Optional[str] = None,
) -> Optional[str]:
    """
    Persist risk assessment to Supabase risk_assessments table.
    Also writes a safety_action record.
    Returns the new assessment ID, or None if persistence unavailable.
    """
    from app.database import get_supabase_client
    client = get_supabase_client()
    if not client:
        return None

    try:
        import uuid
        assessment_id = str(uuid.uuid4())
        workplace_id = req.workplace_id or "00000000-0000-0000-0001-000000000001"

        # Insert risk assessment
        client.table("risk_assessments").insert({
            "id": assessment_id,
            "workplace_id": workplace_id,
            "reading_id": reading_id,
            "risk_level": result["risk_level"],
            "workload": req.workload,
            "exposure_mins": req.duration_mins,
            "contributing_factors": result["contributing_factors"],
            "recommendations": result["recommendations"],
            "explanation": result["explanation"],
            "data_source": result["data_source"],
            "assessed_at": result["assessed_at"],
        }).execute()

        # Record safety action
        client.table("safety_actions").insert({
            "id": str(uuid.uuid4()),
            "assessment_id": assessment_id,
            "actor_id": "00000000-0000-0000-0000-000000000001",  # System actor
            "action_type": "risk_assessed",
            "description": (
                f"Risk assessment generated: {result['risk_level'].upper()} estimated heat exposure concern. "
                f"{len(result['contributing_factors'])} contributing factor(s) identified."
            ),
            "workplace_id": workplace_id,
            "status": "open" if result["risk_level"] in ("elevated", "high") else "resolved",
        }).execute()

        return assessment_id
    except Exception as exc:
        print(f"[INFO] Risk assessment persist skipped: {exc}")
        return None


def fetch_risk_history(workplace_id: str = "wp-001", limit: int = 10) -> list[dict]:
    """
    Fetch recent risk assessments from Supabase.
    Falls back to demo fixture if database unavailable.
    """
    from app.database import get_supabase_client
    from app.demo_fixtures import RISK_ASSESSMENT_FIXTURE

    client = get_supabase_client()
    if not client:
        return [RISK_ASSESSMENT_FIXTURE]

    try:
        result = (
            client.table("risk_assessments")
            .select("*")
            .order("assessed_at", desc=True)
            .limit(limit)
            .execute()
        )
        if result.data:
            return result.data
    except Exception:
        pass

    return [RISK_ASSESSMENT_FIXTURE]
