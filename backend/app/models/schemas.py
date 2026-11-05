# ============================================================
# SHIFTShield 2.0 — Pydantic Models
# All request/response schemas for the API
# ============================================================

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, Any
from datetime import datetime

# ---- Shared enum literals -----------------------------------

RiskLevel = Literal["low", "moderate", "elevated", "high"]
Workload = Literal["light", "moderate", "heavy", "very_heavy"]
Environment = Literal["outdoor_sun", "outdoor_shade", "indoor"]
WeatherSource = Literal["open_meteo", "cached", "demo_fallback", "manual", "sensor"]
WorkerStatus = Literal["safe", "attention", "recovery", "sos"]
AlertType = Literal["sos", "heat_stress", "injury", "water_unavailable", "shade_unavailable"]
AlertStatus = Literal["active", "acknowledged", "responding", "resolved"]
ResourceCategory = Literal["water", "shade", "first_aid"]
ResourceStatus = Literal["available", "unavailable", "unverified"]
ScheduleStatus = Literal["pending", "active", "complete", "skipped"]
ActionType = Literal[
    "risk_assessed", "alert_created", "alert_acknowledged",
    "schedule_changed", "worker_sos", "response_initiated",
    "action_resolved", "resource_reported",
]
ActionStatus = Literal["open", "in_progress", "resolved"]
DemoScenario = Literal["A", "B", "C", "D"]


# ============================================================
# Weather Models
# ============================================================

class HourlyForecastPoint(BaseModel):
    time: str
    temperature_c: float
    humidity_pct: float


class WeatherCurrentResponse(BaseModel):
    temperature_c: float
    humidity_pct: float
    wind_speed_ms: float
    solar_radiation: float
    weather_code: int
    weather_description: str
    source: WeatherSource
    recorded_at: str
    warning: Optional[str] = None
    hourly_forecast: Optional[list[HourlyForecastPoint]] = None

    model_config = {"from_attributes": True}


WEATHER_CODE_DESCRIPTIONS: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
}


# ============================================================
# Risk Assessment Models
# ============================================================

class RiskAssessRequest(BaseModel):
    temperature: float = Field(..., ge=-10, le=60, description="Air temperature in °C")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity %")
    workload: Workload = Field(default="moderate", description="Physical workload level")
    duration_mins: int = Field(..., ge=1, le=480, description="Planned exposure duration in minutes")
    environment: Environment = Field(default="outdoor_sun", description="Work environment")
    acclimatisation_days: Optional[int] = Field(
        default=None, ge=0, le=365,
        description="Number of days the worker has been acclimatising to heat. Omit if unknown."
    )
    workplace_id: Optional[str] = Field(default=None, description="Workplace UUID for persistence")

    @field_validator("temperature")
    @classmethod
    def round_temperature(cls, v: float) -> float:
        return round(v, 1)

    @field_validator("humidity")
    @classmethod
    def round_humidity(cls, v: float) -> float:
        return round(v, 1)


class RiskAssessResponse(BaseModel):
    id: str
    workplace_id: str
    risk_level: RiskLevel
    workload: Workload
    exposure_mins: int
    contributing_factors: list[str]
    recommendations: list[str]
    explanation: str
    data_source: str
    disclaimer: str
    assessed_at: str

    model_config = {"from_attributes": True}


class RiskHistoryItem(BaseModel):
    id: str
    workplace_id: str
    risk_level: RiskLevel
    workload: Workload
    exposure_mins: int
    contributing_factors: list[str]
    recommendations: list[str]
    explanation: str
    data_source: str
    assessed_at: str

    model_config = {"from_attributes": True}


# ============================================================
# Worker Models
# ============================================================

class WorkerResponse(BaseModel):
    id: str
    workplace_id: str
    job_title: Optional[str]
    acclimatisation_days: int
    status: WorkerStatus
    last_seen: str
    full_name: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class UpdateWorkerStatusRequest(BaseModel):
    status: WorkerStatus


# ============================================================
# Task & Schedule Models
# ============================================================

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    workload: Workload = "moderate"
    environment: Environment = "outdoor_sun"
    duration_mins: int = Field(..., ge=1, le=480)
    deadline: Optional[str] = None
    assigned_to: Optional[str] = None
    workplace_id: str = "wp-001"


class TaskResponse(TaskCreate):
    id: str
    created_by: str
    created_at: str

    model_config = {"from_attributes": True}


class ScheduleUpdate(BaseModel):
    status: Optional[ScheduleStatus] = None
    notes: Optional[str] = None


# ============================================================
# Scheduler Models
# ============================================================

class ScheduleGenerateRequest(BaseModel):
    tasks: list[dict[str, Any]]
    date: str = Field(..., description="Date string YYYY-MM-DD")
    workplace_id: str = "wp-001"


class ScheduledSlot(BaseModel):
    task_id: Optional[str]
    worker_id: str
    scheduled_start: str
    scheduled_end: str
    is_recovery: bool = False
    explanation: Optional[str] = None
    task: Optional[dict[str, Any]] = None
    worker: Optional[dict[str, Any]] = None


class ScheduleConflict(BaseModel):
    type: Literal["safety_override_required", "deadline_miss", "overlap", "insufficient_recovery"]
    description: str
    task_id: Optional[str] = None
    worker_id: Optional[str] = None


class ScheduleGenerateResponse(BaseModel):
    schedule: list[ScheduledSlot]
    conflicts: list[ScheduleConflict]
    explanation: str


class ScheduleApplyRequest(BaseModel):
    schedule: list[dict[str, Any]]
    date: str
    workplace_id: str = "wp-001"


# ============================================================
# Cooling Resource Models
# ============================================================

class ResourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: ResourceCategory
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    status: ResourceStatus = "available"
    workplace_id: str = "wp-001"


class ResourceResponse(ResourceCreate):
    id: str
    created_at: str
    last_verified: Optional[str] = None
    added_by: Optional[str] = None

    model_config = {"from_attributes": True}


# ============================================================
# Emergency Alert Models
# ============================================================

class AlertCreate(BaseModel):
    alert_type: AlertType
    notes: Optional[str] = Field(default=None, max_length=500)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    worker_id: Optional[str] = None
    workplace_id: Optional[str] = "wp-001"


class AlertResponse(BaseModel):
    id: str
    worker_id: str
    workplace_id: str
    alert_type: AlertType
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: AlertStatus
    notes: Optional[str] = None
    created_at: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None
    worker: Optional[dict[str, Any]] = None

    model_config = {"from_attributes": True}


# ============================================================
# Safety Action Models
# ============================================================

class SafetyActionCreate(BaseModel):
    alert_id: Optional[str] = None
    assessment_id: Optional[str] = None
    schedule_id: Optional[str] = None
    actor_id: str = "sup-001"
    action_type: ActionType
    description: str = Field(..., min_length=1, max_length=1000)
    related_worker: Optional[str] = None
    workplace_id: str = "wp-001"
    status: ActionStatus = "open"


# ============================================================
# Dashboard Models
# ============================================================

class WorkforceStatus(BaseModel):
    safe: int
    attention: int
    recovery: int
    sos: int


class DashboardOverviewResponse(BaseModel):
    total_active_workers: int
    site_risk_level: RiskLevel
    workers_requiring_attention: int
    pending_safety_actions: int
    completed_interventions_today: int
    workforce_status: WorkforceStatus
    recent_alerts: list[dict[str, Any]]
    upcoming_tasks: list[dict[str, Any]]


# ============================================================
# Demo Models
# ============================================================

class ScenarioRequest(BaseModel):
    scenario: DemoScenario


# ============================================================
# Generic Response Models
# ============================================================

class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    demo_mode: bool
