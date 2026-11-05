import sys
sys.path.insert(0, '.')
import warnings
warnings.filterwarnings('ignore')

print('=== SUB-TASK 2 VERIFICATION ===')

import os
assert os.path.exists('app/services/weather.py'), 'MISSING: services/weather.py'
assert os.path.exists('app/services/risk_engine.py'), 'MISSING: services/risk_engine.py'
assert os.path.exists('app/models/schemas.py'), 'MISSING: models/schemas.py'
print('Services and models: OK')

from app.services.weather import fetch_weather, _build_demo_response, _fetch_open_meteo
print('Weather service imports: OK')

from app.services.risk_engine import run_risk_engine, DISCLAIMER
from app.models.schemas import RiskAssessRequest

# Boundary tests with verified inputs (from check_boundaries.py)
tests = [
    (dict(temperature=22, humidity=50, workload='light', duration_mins=30, environment='indoor'), 'low'),
    (dict(temperature=32, humidity=60, workload='moderate', duration_mins=60, environment='outdoor_shade'), 'moderate'),
    (dict(temperature=35, humidity=60, workload='heavy', duration_mins=90, environment='outdoor_sun'), 'elevated'),
    (dict(temperature=38, humidity=75, workload='very_heavy', duration_mins=150, environment='outdoor_sun'), 'high'),
]
for inputs, expected in tests:
    result = run_risk_engine(RiskAssessRequest(**inputs))
    assert result['risk_level'] == expected, f"T={inputs['temperature']} expected {expected}, got {result['risk_level']}"
    assert 'WBGT' in result['disclaimer'], 'Disclaimer missing WBGT mention'
    assert 'estimated' in result['explanation'].lower() or 'ESTIMATED' in result['explanation'].upper()
    assert len(result['contributing_factors']) > 0
    assert len(result['recommendations']) > 0
print('Risk engine boundary tests: OK (4/4)')

assert 'NOT' in DISCLAIMER and 'WBGT' in DISCLAIMER
print('WBGT disclaimer: OK')

from app.routers.weather import router as wr
from app.routers.risk import router as rr
print('Routers: OK')

print()
print('=== SUB-TASK 3 VERIFICATION ===')

from app.routers import workers, tasks, scheduler, resources, emergency, dashboard, safety, analytics, demo
print('All Sub-Task 3 routers imported: OK')

from app.main import app
paths = list(app.openapi().get('paths', {}).keys())
print(f'Total routes: {len(paths)}')
assert len(paths) >= 30

required = ['/api/workers', '/api/tasks', '/api/scheduler/generate', '/api/scheduler/apply',
            '/api/resources', '/api/emergency', '/api/dashboard/overview',
            '/api/audit-log', '/api/notifications', '/api/demo/scenario', '/api/demo/reset']
for ep in required:
    assert ep in paths, f'MISSING endpoint: {ep}'
print('All required endpoints present: OK')

from fastapi.testclient import TestClient
client = TestClient(app)

r = client.get('/api/dashboard/overview')
assert r.status_code == 200
data = r.json()
assert data['total_active_workers'] == 20
print('GET /api/dashboard/overview: OK (20 workers)')

r = client.get('/api/workers')
assert r.status_code == 200
print(f'GET /api/workers: OK ({len(r.json())} workers)')

r = client.get('/api/resources')
assert r.status_code == 200
print(f'GET /api/resources: OK ({len(r.json())} resources)')

r = client.get('/api/emergency')
assert r.status_code == 200
print(f'GET /api/emergency: OK ({len(r.json())} alerts)')

from app.demo_fixtures import TASKS
r = client.post('/api/scheduler/generate', json={'tasks': TASKS[:3], 'date': '2026-11-05', 'workplace_id': 'wp-001'})
data = r.json()
assert len(data['schedule']) >= 3
print(f'POST /api/scheduler/generate: OK ({len(data["schedule"])} slots, {len(data["conflicts"])} conflicts)')

r = client.post('/api/emergency', json={'alert_type': 'sos', 'notes': 'Test SOS', 'worker_id': 'wk-001', 'workplace_id': 'wp-001'})
assert r.status_code == 201
alert_id = r.json()['id']
r2 = client.patch(f'/api/emergency/{alert_id}/acknowledge')
assert r2.json()['status'] == 'acknowledged'
r3 = client.patch(f'/api/emergency/{alert_id}/resolve')
assert r3.json()['status'] == 'resolved'
print('SOS workflow (create -> acknowledge -> resolve): OK')

import app.config as cfg
cfg.settings.DEMO_MODE = True
r = client.post('/api/demo/scenario', json={'scenario': 'C'})
assert r.status_code == 200
r2 = client.get('/api/weather/current')
assert r2.json()['temperature_c'] == 36.0
r3 = client.post('/api/demo/reset')
assert r3.status_code == 200
r4 = client.get('/api/weather/current')
assert r4.json()['temperature_c'] == 34.2
cfg.settings.DEMO_MODE = False
print('Scenario C + Reset: OK')

print()
print('ALL VERIFICATION COMPLETE: SUB-TASKS 2 AND 3 PASSED')
