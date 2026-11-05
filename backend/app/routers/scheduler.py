# SHIFTShield 2.0 — Scheduler Router (full impl in Sub-Task 3)
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import math

router = APIRouter()


class ScheduleGenerateRequest(BaseModel):
    tasks: list
    date: str
    workplace_id: str = "wp-001"


class ScheduleApplyRequest(BaseModel):
    schedule: list
    date: str
    workplace_id: str = "wp-001"


RECOVERY_GAPS = {
    "low": 10,
    "moderate": 15,
    "elevated": 20,
    "high": 30,
}

RISK_THRESHOLDS = {
    "outdoor_sun_very_heavy": "high",
    "outdoor_sun_heavy": "elevated",
    "outdoor_sun_moderate": "moderate",
    "outdoor_shade_very_heavy": "elevated",
    "outdoor_shade_heavy": "moderate",
    "indoor_very_heavy": "moderate",
    "indoor_heavy": "low",
}


def estimate_task_risk(task: dict) -> str:
    env = task.get("environment", "outdoor_sun")
    workload = task.get("workload", "moderate")
    key = f"{env}_{workload}"
    return RISK_THRESHOLDS.get(key, "moderate")


@router.post("/scheduler/generate")
def generate_schedule(req: ScheduleGenerateRequest):
    if not req.tasks:
        return {"schedule": [], "conflicts": [], "explanation": "No tasks provided."}

    base_date = req.date  # e.g. "2026-11-05"
    schedule = []
    conflicts = []
    explanations = []

    # Simple greedy allocation: one worker, sequential slots
    current_time = datetime.fromisoformat(f"{base_date}T06:00:00")

    for task in req.tasks:
        task_risk = estimate_task_risk(task)
        duration = task.get("duration_mins", 60)
        recovery = RECOVERY_GAPS.get(task_risk, 15)

        # Check deadline constraint
        deadline = task.get("deadline")
        end_time = current_time + timedelta(minutes=duration)

        if deadline:
            dl = datetime.fromisoformat(deadline.replace("Z", ""))
            if end_time > dl:
                if task_risk == "high":
                    conflicts.append({
                        "type": "safety_override_required",
                        "description": f"Task '{task.get('title')}' cannot be safely scheduled before its deadline. High heat risk prevents scheduling during available time slots. Supervisor intervention required.",
                        "task_id": task.get("id"),
                    })
                    explanations.append(f"[CONFLICT] '{task.get('title')}': Safety override required — cannot meet deadline safely.")
                    current_time = end_time + timedelta(minutes=recovery)
                    continue
                else:
                    conflicts.append({
                        "type": "deadline_miss",
                        "description": f"Task '{task.get('title')}' may not complete before its deadline.",
                        "task_id": task.get("id"),
                    })

        slot = {
            "task_id": task.get("id"),
            "worker_id": task.get("assigned_to") or "wk-001",
            "scheduled_start": current_time.isoformat() + "Z",
            "scheduled_end": end_time.isoformat() + "Z",
            "is_recovery": False,
            "explanation": f"Scheduled at {current_time.strftime('%H:%M')} — {task_risk} risk, {duration} min duration.",
            "task": task,
        }
        schedule.append(slot)

        # Insert recovery gap
        if task_risk in ("elevated", "high") or task.get("environment") != "indoor":
            recovery_start = end_time
            recovery_end = recovery_start + timedelta(minutes=recovery)
            schedule.append({
                "task_id": None,
                "worker_id": task.get("assigned_to") or "wk-001",
                "scheduled_start": recovery_start.isoformat() + "Z",
                "scheduled_end": recovery_end.isoformat() + "Z",
                "is_recovery": True,
                "explanation": f"Mandatory recovery break ({recovery} min) — {task_risk} conditions.",
            })
            current_time = recovery_end
        else:
            current_time = end_time

        explanations.append(f"[OK] '{task.get('title')}': {current_time.strftime('%H:%M')} — {task_risk} risk, {recovery} min recovery gap.")

    explanation = "Schedule generated using constraint-first allocation:\n" + "\n".join(explanations)
    if conflicts:
        explanation += f"\n\n[WARNING] {len(conflicts)} conflict(s) require supervisor review."

    return {"schedule": schedule, "conflicts": conflicts, "explanation": explanation}


@router.post("/scheduler/apply")
def apply_schedule(req: ScheduleApplyRequest):
    # In Sub-Task 3: persist to database
    return {"message": "Schedule applied successfully", "count": len(req.schedule)}
