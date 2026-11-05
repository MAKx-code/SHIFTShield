# SHIFTShield 2.0 — Resources Router
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
from app.demo_fixtures import RESOURCES
from datetime import datetime
import uuid

router = APIRouter()

_extra_resources: list = []


class ResourceCreate(BaseModel):
    name: str
    category: Literal["water", "shade", "first_aid"]
    latitude: float
    longitude: float
    address: Optional[str] = None
    status: Literal["available", "unavailable", "unverified"] = "available"
    workplace_id: str = "wp-001"


@router.get("/resources")
def list_resources(category: Optional[str] = None):
    all_resources = RESOURCES + _extra_resources
    if category:
        return [r for r in all_resources if r["category"] == category]
    return all_resources


@router.post("/resources", status_code=201)
def create_resource(req: ResourceCreate):
    resource = {
        "id": f"cr-{uuid.uuid4().hex[:8]}",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "last_verified": datetime.utcnow().isoformat() + "Z",
        "added_by": "sup-001",
        **req.model_dump(),
    }
    _extra_resources.append(resource)
    return resource


@router.patch("/resources/{resource_id}")
def update_resource(resource_id: str, req: ResourceCreate):
    all_resources = RESOURCES + _extra_resources
    resource = next((r for r in all_resources if r["id"] == resource_id), None)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    resource.update(req.model_dump(exclude_unset=True))
    resource["last_verified"] = datetime.utcnow().isoformat() + "Z"
    return resource


@router.delete("/resources/{resource_id}", status_code=204)
def delete_resource(resource_id: str):
    global _extra_resources
    _extra_resources = [r for r in _extra_resources if r["id"] != resource_id]
