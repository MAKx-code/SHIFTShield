# ============================================================
# SHIFTShield 2.0 — Backend Demo Fixtures
# In-memory data returned when DEMO_MODE=True
# ============================================================

from datetime import datetime, timedelta
from typing import Any

_now = datetime.utcnow()

WORKPLACE = {
    "id": "wp-001",
    "name": "Riverside Construction Site",
    "address": "45 Riverside Drive, Sydney NSW 2000",
    "latitude": -33.8688,
    "longitude": 151.2093,
    "created_at": "2026-01-15T08:00:00Z",
}

WORKER_NAMES = [
    ("Marcus Johnson", "Formwork Carpenter"),
    ("Priya Sharma", "Site Labourer"),
    ("Daniel Nguyen", "Steel Fixer"),
    ("Amara Okonkwo", "Concreter"),
    ("Ryan Fitzgerald", "Crane Operator"),
    ("Sophie Chen", "Site Supervisor"),
    ("Liam Torres", "Excavator Operator"),
    ("Fatima Al-Hassan", "Safety Officer"),
    ("Carlos Mendoza", "Bricklayer"),
    ("Yuki Nakamura", "Plumber"),
    ("James O'Brien", "Electrician"),
    ("Asha Patel", "Site Labourer"),
    ("Tom Williams", "Scaffolder"),
    ("Nina Kowalski", "Tiler"),
    ("David Kim", "Formwork Carpenter"),
    ("Grace Adeyemi", "Concreter"),
    ("Ethan Brown", "Steel Fixer"),
    ("Maria Santos", "Site Labourer"),
    ("Ahmed Khalil", "Bricklayer"),
    ("Chloe Thompson", "Scaffolder"),
]

ACCLIMATISATION = [14, 7, 21, 3, 28, 14, 5, 21, 10, 14, 7, 3, 21, 14, 10, 5, 28, 7, 14, 21]

WORKERS: list[dict[str, Any]] = [
    {
        "id": f"wk-{str(i+1).zfill(3)}",
        "workplace_id": "wp-001",
        "job_title": title,
        "acclimatisation_days": ACCLIMATISATION[i],
        "status": "sos" if i == 0 else "attention" if i < 3 else "recovery" if i < 6 else "safe",
        "last_seen": (_now - timedelta(minutes=(i + 1) * 5)).isoformat() + "Z",
        "full_name": name,
        "avatar_url": None,
    }
    for i, (name, title) in enumerate(WORKER_NAMES)
]

TODAY = _now.strftime("%Y-%m-%d")

TASKS: list[dict[str, Any]] = [
    {
        "id": "tk-001", "workplace_id": "wp-001",
        "title": "Formwork Installation — Level 3",
        "description": "Install formwork panels on the eastern face of Level 3.",
        "workload": "heavy", "environment": "outdoor_sun",
        "duration_mins": 120,
        "deadline": (_now + timedelta(hours=4)).isoformat() + "Z",
        "assigned_to": "wk-001", "created_by": "sup-001",
        "created_at": (_now - timedelta(days=1)).isoformat() + "Z",
    },
    {
        "id": "tk-002", "workplace_id": "wp-001",
        "title": "Concrete Pour — Ground Slab",
        "description": "Pour and finish the ground floor slab in Zone B.",
        "workload": "very_heavy", "environment": "outdoor_sun",
        "duration_mins": 180,
        "deadline": (_now + timedelta(hours=6)).isoformat() + "Z",
        "assigned_to": "wk-004", "created_by": "sup-001",
        "created_at": (_now - timedelta(days=1)).isoformat() + "Z",
    },
    {
        "id": "tk-003", "workplace_id": "wp-001",
        "title": "Rebar Tying — Column Foundations",
        "description": "Tie rebar cages for the northern column foundations.",
        "workload": "heavy", "environment": "outdoor_shade",
        "duration_mins": 90,
        "deadline": (_now + timedelta(hours=5)).isoformat() + "Z",
        "assigned_to": "wk-003", "created_by": "sup-001",
        "created_at": (_now - timedelta(days=1)).isoformat() + "Z",
    },
    {
        "id": "tk-004", "workplace_id": "wp-001",
        "title": "Safety Inspection — Zone A",
        "description": "Conduct routine safety walkthrough of Zone A.",
        "workload": "light", "environment": "outdoor_shade",
        "duration_mins": 45,
        "deadline": (_now + timedelta(hours=2)).isoformat() + "Z",
        "assigned_to": "wk-008", "created_by": "sup-001",
        "created_at": (_now - timedelta(hours=1)).isoformat() + "Z",
    },
    {
        "id": "tk-005", "workplace_id": "wp-001",
        "title": "Scaffolding Assembly — West Face",
        "description": "Erect scaffolding along the western face up to Level 2.",
        "workload": "heavy", "environment": "outdoor_sun",
        "duration_mins": 150,
        "deadline": (_now + timedelta(hours=8)).isoformat() + "Z",
        "assigned_to": "wk-013", "created_by": "sup-001",
        "created_at": (_now - timedelta(days=1)).isoformat() + "Z",
    },
]

SCHEDULES: list[dict[str, Any]] = [
    {
        "id": "sc-001", "task_id": "tk-001", "worker_id": "wk-001",
        "scheduled_start": f"{TODAY}T07:00:00Z",
        "scheduled_end": f"{TODAY}T09:00:00Z",
        "status": "active", "notes": None,
        "created_at": (_now - timedelta(days=1)).isoformat() + "Z",
    },
    {
        "id": "sc-002", "task_id": "tk-002", "worker_id": "wk-004",
        "scheduled_start": f"{TODAY}T06:30:00Z",
        "scheduled_end": f"{TODAY}T09:30:00Z",
        "status": "complete", "notes": None,
        "created_at": (_now - timedelta(days=1)).isoformat() + "Z",
    },
    {
        "id": "sc-003", "task_id": "tk-003", "worker_id": "wk-003",
        "scheduled_start": f"{TODAY}T09:30:00Z",
        "scheduled_end": f"{TODAY}T11:00:00Z",
        "status": "pending", "notes": None,
        "created_at": (_now - timedelta(days=1)).isoformat() + "Z",
    },
]

RESOURCES: list[dict[str, Any]] = [
    {
        "id": "cr-001", "workplace_id": "wp-001", "name": "Site Water Station A",
        "category": "water", "latitude": -33.8681, "longitude": 151.2088,
        "address": "Near Eastern Site Entrance", "status": "available",
        "last_verified": (_now - timedelta(hours=2)).isoformat() + "Z",
        "created_at": (_now - timedelta(days=7)).isoformat() + "Z",
    },
    {
        "id": "cr-002", "workplace_id": "wp-001", "name": "Site Water Station B",
        "category": "water", "latitude": -33.8695, "longitude": 151.2098,
        "address": "Western Site Compound", "status": "available",
        "last_verified": (_now - timedelta(hours=1)).isoformat() + "Z",
        "created_at": (_now - timedelta(days=7)).isoformat() + "Z",
    },
    {
        "id": "cr-003", "workplace_id": "wp-001", "name": "Shaded Rest Area — Mess Tent",
        "category": "shade", "latitude": -33.8692, "longitude": 151.2085,
        "address": "Central Site, near Site Office", "status": "available",
        "last_verified": (_now - timedelta(minutes=30)).isoformat() + "Z",
        "created_at": (_now - timedelta(days=7)).isoformat() + "Z",
    },
    {
        "id": "cr-004", "workplace_id": "wp-001", "name": "Shaded Seating — North Boundary",
        "category": "shade", "latitude": -33.8678, "longitude": 151.2100,
        "address": "Northern boundary fence, near Gate 2", "status": "available",
        "last_verified": (_now - timedelta(hours=4)).isoformat() + "Z",
        "created_at": (_now - timedelta(days=3)).isoformat() + "Z",
    },
    {
        "id": "cr-005", "workplace_id": "wp-001", "name": "First Aid Station",
        "category": "first_aid", "latitude": -33.8688, "longitude": 151.2080,
        "address": "Site Office — Ground Floor", "status": "available",
        "last_verified": (_now - timedelta(hours=6)).isoformat() + "Z",
        "created_at": (_now - timedelta(days=7)).isoformat() + "Z",
    },
    {
        "id": "cr-006", "workplace_id": "wp-001", "name": "Water Cooler — Level 1",
        "category": "water", "latitude": -33.8685, "longitude": 151.2095,
        "address": "Level 1 stairwell landing", "status": "unverified",
        "last_verified": (_now - timedelta(hours=24)).isoformat() + "Z",
        "created_at": (_now - timedelta(days=2)).isoformat() + "Z",
    },
]

ALERTS: list[dict[str, Any]] = [
    {
        "id": "ea-001", "worker_id": "wk-001", "workplace_id": "wp-001",
        "alert_type": "sos", "latitude": -33.8685, "longitude": 151.2090,
        "status": "active", "notes": "Feeling dizzy and overheated. Cannot continue work.",
        "created_at": (_now - timedelta(minutes=8)).isoformat() + "Z",
        "acknowledged_by": None, "acknowledged_at": None, "resolved_at": None,
    },
    {
        "id": "ea-002", "worker_id": "wk-002", "workplace_id": "wp-001",
        "alert_type": "heat_stress", "latitude": None, "longitude": None,
        "status": "acknowledged", "notes": "Mild headache and heavy sweating.",
        "created_at": (_now - timedelta(minutes=45)).isoformat() + "Z",
        "acknowledged_by": "sup-001",
        "acknowledged_at": (_now - timedelta(minutes=40)).isoformat() + "Z",
        "resolved_at": None,
    },
    {
        "id": "ea-003", "worker_id": "wk-009", "workplace_id": "wp-001",
        "alert_type": "water_unavailable", "latitude": None, "longitude": None,
        "status": "resolved", "notes": "Water cooler on Level 1 is empty.",
        "created_at": (_now - timedelta(hours=2)).isoformat() + "Z",
        "acknowledged_by": "sup-001",
        "acknowledged_at": (_now - timedelta(minutes=115)).isoformat() + "Z",
        "resolved_at": (_now - timedelta(minutes=90)).isoformat() + "Z",
    },
]

SAFETY_ACTIONS: list[dict[str, Any]] = [
    {
        "id": "sa-001", "alert_id": "ea-001", "assessment_id": None, "schedule_id": None,
        "actor_id": "wk-001", "action_type": "worker_sos",
        "description": "Worker Marcus Johnson activated SOS — Heat stress symptoms reported.",
        "related_worker": "wk-001", "workplace_id": "wp-001", "status": "open",
        "created_at": (_now - timedelta(minutes=8)).isoformat() + "Z",
    },
    {
        "id": "sa-002", "alert_id": None, "assessment_id": "ra-001", "schedule_id": None,
        "actor_id": "sup-001", "action_type": "risk_assessed",
        "description": "Risk assessment generated: Elevated heat exposure concern for current site conditions.",
        "related_worker": None, "workplace_id": "wp-001", "status": "in_progress",
        "created_at": (_now - timedelta(minutes=25)).isoformat() + "Z",
    },
    {
        "id": "sa-003", "alert_id": "ea-002", "assessment_id": None, "schedule_id": None,
        "actor_id": "sup-001", "action_type": "alert_acknowledged",
        "description": "Supervisor acknowledged heat stress alert for Priya Sharma. Recovery break assigned.",
        "related_worker": "wk-002", "workplace_id": "wp-001", "status": "in_progress",
        "created_at": (_now - timedelta(minutes=40)).isoformat() + "Z",
    },
    {
        "id": "sa-004", "alert_id": None, "assessment_id": None, "schedule_id": "sc-001",
        "actor_id": "sup-001", "action_type": "schedule_changed",
        "description": "Schedule updated: Formwork Installation rescheduled to 07:00 to reduce peak heat exposure.",
        "related_worker": None, "workplace_id": "wp-001", "status": "resolved",
        "created_at": (_now - timedelta(days=1)).isoformat() + "Z",
    },
    {
        "id": "sa-005", "alert_id": "ea-003", "assessment_id": None, "schedule_id": None,
        "actor_id": "sup-001", "action_type": "action_resolved",
        "description": "Water cooler Level 1 refilled and confirmed operational.",
        "related_worker": "wk-009", "workplace_id": "wp-001", "status": "resolved",
        "created_at": (_now - timedelta(minutes=90)).isoformat() + "Z",
    },
]

WEATHER_FIXTURE = {
    "temperature_c": 34.2,
    "humidity_pct": 68.0,
    "wind_speed_ms": 3.1,
    "solar_radiation": 780.0,
    "weather_code": 0,
    "weather_description": "Clear sky",
    "source": "demo_fallback",
    "recorded_at": _now.isoformat() + "Z",
    "warning": None,
}

RISK_ASSESSMENT_FIXTURE = {
    "id": "ra-001",
    "workplace_id": "wp-001",
    "risk_level": "elevated",
    "workload": "heavy",
    "exposure_mins": 120,
    "contributing_factors": [
        "High environmental temperature (34.2°C)",
        "Elevated relative humidity (68%)",
        "Direct sun exposure (outdoor, unshaded)",
        "Heavy physical workload",
        "Extended exposure duration (120 minutes)",
    ],
    "recommendations": [
        "Review the planned outdoor work period — reschedule heavy tasks to before 9:00 AM or after 4:00 PM.",
        "Ensure mandatory recovery breaks every 30 minutes for workers on heavy outdoor tasks.",
        "Confirm drinking water access within 50 metres of all active work areas.",
        "Identify and use available shaded recovery areas during breaks.",
        "Monitor workers closely for signs of heat stress.",
        "Follow the site heat illness emergency response protocol if any symptoms are reported.",
    ],
    "explanation": (
        "Current conditions present an elevated heat exposure concern. The combination of high ambient temperature "
        "(34.2°C), significant relative humidity (68%), direct sun exposure, and heavy physical workload creates "
        "conditions where heat stress risk is substantially higher than baseline."
    ),
    "data_source": "Simulated demo data — not from a live weather service",
    "disclaimer": (
        "This assessment is an estimated heat exposure concern based on environmental and workload inputs. "
        "It is not a medically validated measurement (such as WBGT). Use as a decision-support tool alongside "
        "qualified occupational health guidance and your organisation's heat management policy."
    ),
    "assessed_at": _now.isoformat() + "Z",
}

# Mutable demo state (modified by scenario switcher)
_demo_state = {
    "scenario": None,
    "workers": WORKERS.copy(),
    "alerts": ALERTS.copy(),
    "weather": WEATHER_FIXTURE.copy(),
    "risk_level": "elevated",
}

SCENARIOS = {
    "A": {
        "label": "Normal Conditions",
        "weather_override": {"temperature_c": 24.0, "humidity_pct": 55.0, "wind_speed_ms": 4.2, "solar_radiation": 380.0, "weather_code": 1, "weather_description": "Mainly clear"},
        "risk_level": "low",
        "worker_statuses": {"sos": 0, "attention": 0, "recovery": 0},
        "active_alerts": 0,
    },
    "B": {
        "label": "Elevated Heat Exposure",
        "weather_override": {"temperature_c": 38.0, "humidity_pct": 75.0, "wind_speed_ms": 1.8, "solar_radiation": 920.0, "weather_code": 0, "weather_description": "Clear sky — extreme heat"},
        "risk_level": "elevated",
        "worker_statuses": {"sos": 1, "attention": 4, "recovery": 3},
        "active_alerts": 2,
    },
    "C": {
        "label": "Heavy Workload + Hot Conditions",
        "weather_override": {"temperature_c": 36.0, "humidity_pct": 70.0, "wind_speed_ms": 2.0, "solar_radiation": 860.0, "weather_code": 0, "weather_description": "Clear sky — hot and humid"},
        "risk_level": "high",
        "worker_statuses": {"sos": 2, "attention": 3, "recovery": 5},
        "active_alerts": 3,
    },
    "D": {
        "label": "Worker Emergency — SOS Active",
        "weather_override": {"temperature_c": 34.0, "humidity_pct": 65.0, "wind_speed_ms": 2.5, "solar_radiation": 720.0, "weather_code": 0, "weather_description": "Clear sky"},
        "risk_level": "moderate",
        "worker_statuses": {"sos": 1, "attention": 2, "recovery": 1},
        "active_alerts": 1,
    },
}


def get_demo_state() -> dict:
    return _demo_state


def apply_scenario(scenario: str) -> None:
    if scenario not in SCENARIOS:
        return
    config = SCENARIOS[scenario]
    _demo_state["scenario"] = scenario
    _demo_state["weather"] = {**WEATHER_FIXTURE, **config["weather_override"], "source": "demo_fallback"}
    _demo_state["risk_level"] = config["risk_level"]
    # Recompute worker statuses
    s = config["worker_statuses"]
    updated = []
    for i, w in enumerate(WORKERS):
        if i < s["sos"]:
            status = "sos"
        elif i < s["sos"] + s["attention"]:
            status = "attention"
        elif i < s["sos"] + s["attention"] + s["recovery"]:
            status = "recovery"
        else:
            status = "safe"
        updated.append({**w, "status": status})
    _demo_state["workers"] = updated
    _demo_state["alerts"] = ALERTS[:config["active_alerts"]]


def reset_demo() -> None:
    _demo_state["scenario"] = None
    _demo_state["workers"] = WORKERS.copy()
    _demo_state["alerts"] = ALERTS.copy()
    _demo_state["weather"] = WEATHER_FIXTURE.copy()
    _demo_state["risk_level"] = "elevated"
