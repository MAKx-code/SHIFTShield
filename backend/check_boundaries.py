import sys; sys.path.insert(0, '.')
from app.services.risk_engine import run_risk_engine
from app.models.schemas import RiskAssessRequest

for temp in [28, 30, 32, 34, 36, 38]:
    r = run_risk_engine(RiskAssessRequest(temperature=temp, humidity=60, workload='moderate', duration_mins=60, environment='outdoor_shade'))
    print(f'T={temp} -> {r["risk_level"]}')

print()
# Correct boundary test values
tests = [
    (dict(temperature=22, humidity=50, workload='light', duration_mins=30, environment='indoor'), 'low'),
    (dict(temperature=32, humidity=65, workload='moderate', duration_mins=60, environment='outdoor_shade'), 'moderate'),
    (dict(temperature=36, humidity=68, workload='heavy', duration_mins=90, environment='outdoor_sun'), 'elevated'),
    (dict(temperature=38, humidity=75, workload='very_heavy', duration_mins=150, environment='outdoor_sun'), 'high'),
]
for inputs, expected in tests:
    result = run_risk_engine(RiskAssessRequest(**inputs))
    status = 'PASS' if result['risk_level'] == expected else 'FAIL'
    print(f'{status}: T={inputs["temperature"]} -> {result["risk_level"]} (expected {expected})')
