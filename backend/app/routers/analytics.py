# SHIFTShield 2.0 — Analytics Router
from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta
import math

router = APIRouter()


def _generate_trend(days: int = 14):
    now = datetime.utcnow()
    levels = ["low", "low", "moderate", "moderate", "elevated", "elevated", "high", "elevated",
              "moderate", "elevated", "elevated", "high", "elevated", "elevated"]
    scores = [20, 25, 45, 48, 65, 68, 82, 70, 42, 67, 70, 85, 72, 68]
    return [
        {
            "date": (now - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d"),
            "risk_level": levels[i % len(levels)],
            "score": scores[i % len(scores)],
        }
        for i in range(days)
    ]


@router.get("/analytics")
def get_analytics(
    date_from: Optional[str] = Query(default=None),
    date_to: Optional[str] = Query(default=None),
):
    return {
        "daily_risk_trend": _generate_trend(14),
        "workforce_distribution": [
            {"status": "safe", "count": 14},
            {"status": "attention", "count": 3},
            {"status": "recovery", "count": 2},
            {"status": "sos", "count": 1},
        ],
        "task_exposure": [
            {"workload": "light", "count": 8, "avg_duration_mins": 45},
            {"workload": "moderate", "count": 12, "avg_duration_mins": 75},
            {"workload": "heavy", "count": 15, "avg_duration_mins": 110},
            {"workload": "very_heavy", "count": 5, "avg_duration_mins": 150},
        ],
        "recovery_compliance": [
            {
                "date": (datetime.utcnow() - timedelta(days=13 - i)).strftime("%Y-%m-%d"),
                "compliance_pct": [82, 78, 85, 80, 72, 68, 75, 79, 83, 76, 70, 65, 72, 77][i],
            }
            for i in range(14)
        ],
        "emergency_requests": [
            {
                "date": (datetime.utcnow() - timedelta(days=13 - i)).strftime("%Y-%m-%d"),
                "count": [0, 1, 0, 2, 1, 3, 2, 1, 0, 2, 3, 4, 2, 2][i],
            }
            for i in range(14)
        ],
        "action_completion": [
            {"action_type": "risk_assessed", "completed": 28, "total": 28},
            {"action_type": "alert_acknowledged", "completed": 14, "total": 16},
            {"action_type": "response_initiated", "completed": 12, "total": 14},
            {"action_type": "action_resolved", "completed": 10, "total": 14},
            {"action_type": "schedule_changed", "completed": 8, "total": 8},
        ],
    }


@router.get("/analytics/export")
def export_analytics_csv():
    from fastapi.responses import Response
    trend = _generate_trend(14)
    rows = ["Date,Risk Level,Risk Score\n"]
    for d in trend:
        rows.append(f"{d['date']},{d['risk_level']},{d['score']}\n")
    csv_content = "".join(rows)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=shiftshield-analytics.csv"},
    )
