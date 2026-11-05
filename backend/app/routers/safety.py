# SHIFTShield 2.0 — Safety Actions / Audit Log / Notifications Router
from fastapi import APIRouter, Query
from typing import Optional
from app.demo_fixtures import SAFETY_ACTIONS
from datetime import datetime
import uuid

router = APIRouter()

_extra_actions: list = []

NOTIFICATIONS = [
    {
        "id": "n-001",
        "recipient_id": "sup-001",
        "type": "sos",
        "title": "SOS Alert — Marcus Johnson",
        "body": "Worker has activated emergency assistance. Heat stress symptoms reported.",
        "read": False,
        "reference_id": "ea-001",
        "reference_type": "emergency_alert",
        "created_at": (datetime.utcnow()).isoformat() + "Z",
    },
    {
        "id": "n-002",
        "recipient_id": "sup-001",
        "type": "risk_alert",
        "title": "Elevated Heat Risk — Site Conditions",
        "body": "Current conditions have been assessed as Elevated risk. Review active outdoor tasks.",
        "read": False,
        "reference_id": "ra-001",
        "reference_type": "risk_assessment",
        "created_at": (datetime.utcnow()).isoformat() + "Z",
    },
    {
        "id": "n-003",
        "recipient_id": "sup-001",
        "type": "schedule",
        "title": "Schedule Applied for Today",
        "body": "Optimised work schedule has been applied for all 20 workers.",
        "read": True,
        "created_at": (datetime.utcnow()).isoformat() + "Z",
    },
]


@router.get("/audit-log")
def get_audit_log(
    action_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
):
    actions = SAFETY_ACTIONS + _extra_actions
    if action_type:
        actions = [a for a in actions if a["action_type"] == action_type]
    if status:
        actions = [a for a in actions if a["status"] == status]
    if search:
        search_lower = search.lower()
        actions = [a for a in actions if search_lower in a.get("description", "").lower()]
    # Reverse chronological
    actions = sorted(actions, key=lambda a: a["created_at"], reverse=True)
    return actions


@router.post("/safety-actions", status_code=201)
def create_safety_action(data: dict):
    action = {
        "id": f"sa-{uuid.uuid4().hex[:8]}",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "status": "open",
        **data,
    }
    _extra_actions.append(action)
    return action


@router.get("/notifications")
def get_notifications():
    return [n for n in NOTIFICATIONS if not n["read"]] + [n for n in NOTIFICATIONS if n["read"]]


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    notif = next((n for n in NOTIFICATIONS if n["id"] == notification_id), None)
    if notif:
        notif["read"] = True
    return {"ok": True}
