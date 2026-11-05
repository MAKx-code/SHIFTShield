# ============================================================
# SHIFTShield 2.0 — FastAPI Application Entry Point
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# ---- Create app ---------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="SHIFTShield 2.0 — Occupational Heat Safety Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---- CORS middleware ----------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Include routers ----------------------------------------
# Routers are imported here; each is implemented in its own module

from app.routers import weather, risk, workers, tasks, scheduler, resources, emergency, dashboard, safety, demo, analytics  # noqa: E402

app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(weather.router, prefix="/api", tags=["Weather"])
app.include_router(risk.router, prefix="/api", tags=["Risk Engine"])
app.include_router(workers.router, prefix="/api", tags=["Workers"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks & Schedules"])
app.include_router(scheduler.router, prefix="/api", tags=["Scheduler"])
app.include_router(resources.router, prefix="/api", tags=["Cooling Resources"])
app.include_router(emergency.router, prefix="/api", tags=["Emergency"])
app.include_router(safety.router, prefix="/api", tags=["Safety Actions & Audit"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(demo.router, prefix="/api", tags=["Demo"])

# ---- Health check -------------------------------------------

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "demo_mode": settings.DEMO_MODE,
    }

@app.get("/", tags=["Health"])
def root():
    return {
        "message": "SHIFTShield 2.0 API",
        "docs": "/docs",
        "health": "/health",
        "demo_mode": settings.DEMO_MODE,
    }
