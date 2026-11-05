# SHIFTShield 2.0 — Workers Router
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from app.config import settings
from app.demo_fixtures import get_demo_state, WORKERS

router = APIRouter()

WorkerStatus = Literal["safe", "attention", "recovery", "sos"]


class UpdateStatusRequest(BaseModel):
    status: WorkerStatus


@router.get("/workers")
def list_workers():
    state = get_demo_state()
    return state["workers"] if settings.DEMO_MODE else WORKERS


@router.get("/workers/{worker_id}")
def get_worker(worker_id: str):
    state = get_demo_state()
    workers = state["workers"] if settings.DEMO_MODE else WORKERS
    worker = next((w for w in workers if w["id"] == worker_id), None)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker


@router.patch("/workers/{worker_id}/status")
def update_worker_status(worker_id: str, req: UpdateStatusRequest):
    state = get_demo_state()
    workers = state["workers"] if settings.DEMO_MODE else WORKERS
    worker = next((w for w in workers if w["id"] == worker_id), None)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    worker["status"] = req.status
    return worker
