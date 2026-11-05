# SHIFTShield 2.0 — Dashboard Router (stub, full impl in Sub-Task 3)
from fastapi import APIRouter
from app.config import settings
from app.demo_fixtures import get_demo_state, WORKERS, TASKS, SCHEDULES, ALERTS, SAFETY_ACTIONS

router = APIRouter()


@router.get("/dashboard/overview")
def get_overview():
    state = get_demo_state()
    workers = state["workers"] if settings.DEMO_MODE else WORKERS
    alerts = state["alerts"] if settings.DEMO_MODE else ALERTS
    pending_actions = sum(1 for a in SAFETY_ACTIONS if a["status"] in ("open", "in_progress"))
    completed_today = sum(1 for a in SAFETY_ACTIONS if a["status"] == "resolved")

    statuses = {s: sum(1 for w in workers if w["status"] == s) for s in ("safe", "attention", "recovery", "sos")}
    attention_count = statuses["attention"] + statuses["recovery"] + statuses["sos"]

    return {
        "total_active_workers": len(workers),
        "site_risk_level": state.get("risk_level", "elevated"),
        "workers_requiring_attention": attention_count,
        "pending_safety_actions": pending_actions,
        "completed_interventions_today": completed_today,
        "workforce_status": statuses,
        "recent_alerts": alerts[:4],
        "upcoming_tasks": [s for s in SCHEDULES if s["status"] == "pending"][:5],
    }
