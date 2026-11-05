# SHIFTShield 2.0 — Demo Controller Router
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from app.demo_fixtures import apply_scenario, reset_demo, SCENARIOS

router = APIRouter()


class ScenarioRequest(BaseModel):
    scenario: Literal["A", "B", "C", "D"]


@router.post("/demo/scenario")
def set_scenario(req: ScenarioRequest):
    apply_scenario(req.scenario)
    config = SCENARIOS[req.scenario]
    return {
        "message": f"Scenario {req.scenario} applied: {config['label']}",
        "scenario": req.scenario,
        "label": config["label"],
    }


@router.post("/demo/reset")
def reset_demo_data():
    reset_demo()
    return {"message": "Demo data reset to initial state."}


@router.get("/demo/scenarios")
def list_scenarios():
    return [
        {"id": k, "label": v["label"]}
        for k, v in SCENARIOS.items()
    ]


@router.get("/workplaces/current")
def get_current_workplace():
    from app.demo_fixtures import WORKPLACE
    return WORKPLACE
