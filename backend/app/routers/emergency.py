# SHIFTShield 2.0 — Emergency Router
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
from app.config import settings
from app.demo_fixtures import get_demo_state, ALERTS, WORKERS
from datetime import datetime
import uuid

router = APIRouter()

_extra_alerts: list = []


class AlertCreate(BaseModel):
    alert_type: Literal["sos", "heat_stress", "injury", "water_unavailable", "shade_unavailable"]
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    worker_id: Optional[str] = "wk-001"
    workplace_id: Optional[str] = "wp-001"


def _enrich_alert(alert: dict) -> dict:
    """Attach worker details to alert."""
    worker = next((w for w in WORKERS if w["id"] == alert.get("worker_id")), None)
    return {**alert, "worker": worker}


@router.get("/emergency")
def list_alerts():
    state = get_demo_state()
    alerts = state["alerts"] if settings.DEMO_MODE else (ALERTS + _extra_alerts)
    return [_enrich_alert(a) for a in alerts]


@router.post("/emergency", status_code=201)
def create_alert(req: AlertCreate):
    alert = {
        "id": f"ea-{uuid.uuid4().hex[:8]}",
        "status": "active",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "acknowledged_by": None,
        "acknowledged_at": None,
        "resolved_at": None,
        **req.model_dump(),
    }
    _extra_alerts.append(alert)
    # Also update demo state
    state = get_demo_state()
    state["alerts"].append(alert)
    return _enrich_alert(alert)


@router.patch("/emergency/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    state = get_demo_state()
    alerts = state["alerts"] + _extra_alerts
    alert = next((a for a in alerts if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["status"] = "acknowledged"
    alert["acknowledged_by"] = "sup-001"
    alert["acknowledged_at"] = datetime.utcnow().isoformat() + "Z"
    return _enrich_alert(alert)


@router.patch("/emergency/{alert_id}/respond")
def respond_alert(alert_id: str, responder: Optional[str] = None):
    state = get_demo_state()
    alerts = state["alerts"] + _extra_alerts
    alert = next((a for a in alerts if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["status"] = "responding"
    if responder:
        alert["notes"] = f"Responder: {responder}. " + (alert.get("notes") or "")
    return _enrich_alert(alert)


@router.patch("/emergency/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    state = get_demo_state()
    alerts = state["alerts"] + _extra_alerts
    alert = next((a for a in alerts if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert["status"] = "resolved"
    alert["resolved_at"] = datetime.utcnow().isoformat() + "Z"
    return _enrich_alert(alert)
