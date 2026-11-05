# SHIFTShield 2.0 — Tasks Router
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
from app.config import settings
from app.demo_fixtures import TASKS, SCHEDULES
from datetime import datetime
import uuid

router = APIRouter()


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    workload: Literal["light", "moderate", "heavy", "very_heavy"] = "moderate"
    environment: Literal["outdoor_sun", "outdoor_shade", "indoor"] = "outdoor_sun"
    duration_mins: int
    deadline: Optional[str] = None
    assigned_to: Optional[str] = None
    workplace_id: str = "wp-001"


class ScheduleUpdate(BaseModel):
    status: Optional[Literal["pending", "active", "complete", "skipped"]] = None
    notes: Optional[str] = None


_extra_tasks: list = []
_extra_schedules: list = []


@router.get("/tasks")
def list_tasks():
    return TASKS + _extra_tasks


@router.post("/tasks", status_code=201)
def create_task(req: TaskCreate):
    task = {
        "id": f"tk-{uuid.uuid4().hex[:8]}",
        "created_by": "sup-001",
        "created_at": datetime.utcnow().isoformat() + "Z",
        **req.model_dump(),
    }
    _extra_tasks.append(task)
    return task


@router.patch("/tasks/{task_id}")
def update_task(task_id: str, req: TaskCreate):
    all_tasks = TASKS + _extra_tasks
    task = next((t for t in all_tasks if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.update(req.model_dump(exclude_unset=True))
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: str):
    global _extra_tasks
    _extra_tasks = [t for t in _extra_tasks if t["id"] != task_id]


@router.get("/schedules")
def list_schedules(date: Optional[str] = None):
    return SCHEDULES + _extra_schedules


@router.patch("/schedules/{schedule_id}")
def update_schedule(schedule_id: str, req: ScheduleUpdate):
    all_schedules = SCHEDULES + _extra_schedules
    schedule = next((s for s in all_schedules if s["id"] == schedule_id), None)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    schedule.update(req.model_dump(exclude_unset=True, exclude_none=True))
    return schedule
