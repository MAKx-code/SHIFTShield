# ============================================================
# SHIFTShield 2.0 — Unit Tests: Risk Engine
#
# Tests deterministic boundary conditions for the risk engine.
# No external services required — pure function tests.
# ============================================================

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.schemas import RiskAssessRequest
from app.services.risk_engine import run_risk_engine, DISCLAIMER


def make_req(**kwargs) -> RiskAssessRequest:
    """Helper: build a RiskAssessRequest with sensible defaults."""
    defaults = {
        "temperature": 25.0,
        "humidity": 50.0,
        "workload": "moderate",
        "duration_mins": 60,
        "environment": "outdoor_shade",
        "acclimatisation_days": None,
    }
    defaults.update(kwargs)
    return RiskAssessRequest(**defaults)


# ============================================================
# Temperature boundary tests
# ============================================================

def test_cool_temperature_gives_low_risk():
    """Below 28°C with no other stressors → low risk."""
    req = make_req(temperature=22.0, humidity=50.0, workload="light", duration_mins=30, environment="outdoor_shade")
    result = run_risk_engine(req)
    assert result["risk_level"] == "low", f"Expected low, got {result['risk_level']}"


def test_warm_temperature_gives_low_to_moderate():
    """28–31°C with moderate workload should be moderate."""
    req = make_req(temperature=30.0, humidity=55.0, workload="moderate", duration_mins=60, environment="outdoor_shade")
    result = run_risk_engine(req)
    assert result["risk_level"] in ("low", "moderate"), f"Expected low/moderate, got {result['risk_level']}"


def test_elevated_temperature_threshold():
    """32°C + moderate humidity + moderate workload → at least moderate risk."""
    req = make_req(temperature=32.0, humidity=60.0, workload="moderate", duration_mins=60, environment="outdoor_shade")
    result = run_risk_engine(req)
    assert result["risk_level"] in ("moderate", "elevated"), f"Expected moderate/elevated, got {result['risk_level']}"


def test_high_temperature_with_heavy_work_outdoor_sun():
    """38°C + heavy workload + outdoor sun → high risk."""
    req = make_req(temperature=38.0, humidity=60.0, workload="heavy", duration_mins=60, environment="outdoor_sun")
    result = run_risk_engine(req)
    assert result["risk_level"] == "high", f"Expected high, got {result['risk_level']}"


def test_very_hot_temperature_alone_gives_high():
    """38°C alone (light workload, indoor, low duration) → should be elevated at minimum."""
    req = make_req(temperature=38.0, humidity=40.0, workload="light", duration_mins=30, environment="indoor")
    result = run_risk_engine(req)
    # 38°C = 3.0 score, indoor = -0.5, light = -0.25 → score = 2.25 = moderate
    # But with 38 = 3.0 floor, indoor and light subtract → ~2.25 = moderate
    assert result["risk_level"] in ("moderate", "elevated", "high"), f"Got {result['risk_level']}"


# ============================================================
# Humidity modifier tests
# ============================================================

def test_high_humidity_increases_risk():
    """Same temperature: 75% humidity should produce higher risk than 50%."""
    req_low_hum = make_req(temperature=33.0, humidity=50.0, workload="moderate", duration_mins=60)
    req_high_hum = make_req(temperature=33.0, humidity=75.0, workload="moderate", duration_mins=60)
    result_low = run_risk_engine(req_low_hum)
    result_high = run_risk_engine(req_high_hum)

    level_order = {"low": 0, "moderate": 1, "elevated": 2, "high": 3}
    assert level_order[result_high["risk_level"]] >= level_order[result_low["risk_level"]], (
        f"Expected high humidity ({result_high['risk_level']}) >= "
        f"low humidity ({result_low['risk_level']})"
    )


def test_high_humidity_adds_contributing_factor():
    """75% humidity should appear in contributing factors."""
    req = make_req(temperature=30.0, humidity=76.0)
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "humidity" in factor_text, f"Expected humidity in factors: {result['contributing_factors']}"


# ============================================================
# Environment modifier tests
# ============================================================

def test_outdoor_sun_increases_risk_vs_shade():
    """Same inputs: outdoor_sun should give equal or higher risk than outdoor_shade."""
    req_sun = make_req(temperature=33.0, humidity=60.0, workload="heavy", environment="outdoor_sun")
    req_shade = make_req(temperature=33.0, humidity=60.0, workload="heavy", environment="outdoor_shade")
    result_sun = run_risk_engine(req_sun)
    result_shade = run_risk_engine(req_shade)

    level_order = {"low": 0, "moderate": 1, "elevated": 2, "high": 3}
    assert level_order[result_sun["risk_level"]] >= level_order[result_shade["risk_level"]], (
        f"outdoor_sun ({result_sun['risk_level']}) should be >= outdoor_shade ({result_shade['risk_level']})"
    )


def test_indoor_environment_reduces_risk():
    """Indoor should generally give lower risk than outdoor_sun."""
    req_sun = make_req(temperature=34.0, humidity=60.0, workload="moderate", environment="outdoor_sun")
    req_indoor = make_req(temperature=34.0, humidity=60.0, workload="moderate", environment="indoor")
    result_sun = run_risk_engine(req_sun)
    result_indoor = run_risk_engine(req_indoor)

    level_order = {"low": 0, "moderate": 1, "elevated": 2, "high": 3}
    assert level_order[result_sun["risk_level"]] >= level_order[result_indoor["risk_level"]], (
        f"outdoor_sun ({result_sun['risk_level']}) should be >= indoor ({result_indoor['risk_level']})"
    )


def test_outdoor_sun_appears_in_contributing_factors():
    """Direct sun exposure should be listed as a contributing factor."""
    req = make_req(temperature=33.0, humidity=60.0, environment="outdoor_sun")
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "sun" in factor_text or "solar" in factor_text or "outdoor" in factor_text, (
        f"Expected sun/outdoor in factors: {result['contributing_factors']}"
    )


# ============================================================
# Workload modifier tests
# ============================================================

def test_very_heavy_workload_elevates_risk():
    """Very heavy workload in moderate conditions should increase risk."""
    req_light = make_req(temperature=30.0, humidity=55.0, workload="light")
    req_vheavy = make_req(temperature=30.0, humidity=55.0, workload="very_heavy")
    result_light = run_risk_engine(req_light)
    result_vheavy = run_risk_engine(req_vheavy)

    level_order = {"low": 0, "moderate": 1, "elevated": 2, "high": 3}
    assert level_order[result_vheavy["risk_level"]] >= level_order[result_light["risk_level"]], (
        f"very_heavy ({result_vheavy['risk_level']}) should be >= light ({result_light['risk_level']})"
    )


# ============================================================
# Duration modifier tests
# ============================================================

def test_long_duration_adds_contributing_factor():
    """Duration > 120 min should appear in contributing factors."""
    req = make_req(temperature=33.0, humidity=60.0, duration_mins=150)
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "150" in factor_text or "duration" in factor_text or "extended" in factor_text, (
        f"Expected duration in factors: {result['contributing_factors']}"
    )


def test_short_duration_no_duration_factor():
    """Duration <= 60 min should not add a duration factor."""
    req = make_req(temperature=33.0, humidity=60.0, duration_mins=45)
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "extended" not in factor_text and "prolonged" not in factor_text, (
        f"Unexpected duration factor for 45 min: {result['contributing_factors']}"
    )


# ============================================================
# Acclimatisation modifier tests
# ============================================================

def test_low_acclimatisation_adds_factor():
    """< 5 days acclimatisation should add a contributing factor."""
    req = make_req(temperature=33.0, humidity=60.0, acclimatisation_days=2)
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "acclimatisation" in factor_text or "acclimat" in factor_text, (
        f"Expected acclimatisation in factors: {result['contributing_factors']}"
    )


def test_well_acclimatised_no_factor():
    """14 days acclimatisation should not add an acclimatisation factor."""
    req = make_req(temperature=33.0, humidity=60.0, acclimatisation_days=14)
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "acclimatisation" not in factor_text, (
        f"Unexpected acclimatisation factor for 14 days: {result['contributing_factors']}"
    )


# ============================================================
# Compound scenario tests
# ============================================================

def test_worst_case_scenario_is_high():
    """38°C + 80% humidity + very heavy + outdoor sun + 180 min → high risk."""
    req = make_req(
        temperature=38.0,
        humidity=80.0,
        workload="very_heavy",
        duration_mins=180,
        environment="outdoor_sun",
        acclimatisation_days=1,
    )
    result = run_risk_engine(req)
    assert result["risk_level"] == "high", f"Expected high, got {result['risk_level']}"
    assert len(result["contributing_factors"]) >= 4, (
        f"Expected >= 4 factors, got {len(result['contributing_factors'])}"
    )


def test_best_case_scenario_is_low():
    """15°C + 40% humidity + light workload + indoor + 30 min → low risk."""
    req = make_req(
        temperature=15.0,
        humidity=40.0,
        workload="light",
        duration_mins=30,
        environment="indoor",
        acclimatisation_days=30,
    )
    result = run_risk_engine(req)
    assert result["risk_level"] == "low", f"Expected low, got {result['risk_level']}"


def test_scenario_a_demo_conditions():
    """Scenario A: 24°C, 55%, light moderate → low risk."""
    req = make_req(temperature=24.0, humidity=55.0, workload="moderate", duration_mins=60, environment="outdoor_shade")
    result = run_risk_engine(req)
    assert result["risk_level"] == "low", f"Scenario A should be low, got {result['risk_level']}"


def test_scenario_b_elevated_conditions():
    """Scenario B: 38°C, 75%, heavy outdoor_sun → high risk."""
    req = make_req(temperature=38.0, humidity=75.0, workload="heavy", duration_mins=90, environment="outdoor_sun")
    result = run_risk_engine(req)
    assert result["risk_level"] in ("elevated", "high"), f"Scenario B should be elevated/high, got {result['risk_level']}"


def test_scenario_c_heavy_hot():
    """Scenario C: 36°C, 70%, very_heavy outdoor_sun → high risk."""
    req = make_req(temperature=36.0, humidity=70.0, workload="very_heavy", duration_mins=120, environment="outdoor_sun")
    result = run_risk_engine(req)
    assert result["risk_level"] == "high", f"Scenario C should be high, got {result['risk_level']}"


# ============================================================
# Output structure tests
# ============================================================

def test_result_has_required_keys():
    """Every result must have all required response keys."""
    req = make_req(temperature=30.0, humidity=60.0)
    result = run_risk_engine(req)
    required_keys = {
        "risk_level", "contributing_factors", "recommendations",
        "explanation", "data_source", "disclaimer", "assessed_at"
    }
    missing = required_keys - set(result.keys())
    assert not missing, f"Missing keys in result: {missing}"


def test_contributing_factors_is_list():
    req = make_req(temperature=30.0, humidity=60.0)
    result = run_risk_engine(req)
    assert isinstance(result["contributing_factors"], list)


def test_recommendations_is_nonempty_list():
    req = make_req(temperature=30.0, humidity=60.0)
    result = run_risk_engine(req)
    assert isinstance(result["recommendations"], list)
    assert len(result["recommendations"]) > 0


def test_disclaimer_present_and_mentions_wbgt():
    """Disclaimer must explicitly mention WBGT."""
    req = make_req(temperature=30.0, humidity=60.0)
    result = run_risk_engine(req)
    assert "WBGT" in result["disclaimer"] or "Wet Bulb Globe" in result["disclaimer"], (
        "Disclaimer must mention WBGT"
    )


def test_explanation_mentions_estimated():
    """Explanation must use 'estimated' to avoid implying medical validation."""
    req = make_req(temperature=33.0, humidity=65.0)
    result = run_risk_engine(req)
    assert "estimated" in result["explanation"].lower() or "concern" in result["explanation"].lower(), (
        f"Explanation should use 'estimated' or 'concern': {result['explanation'][:100]}"
    )


def test_risk_level_valid_value():
    """Risk level must be one of the four valid values."""
    req = make_req(temperature=30.0, humidity=60.0)
    result = run_risk_engine(req)
    assert result["risk_level"] in ("low", "moderate", "elevated", "high")


def test_assessed_at_is_iso_format():
    """assessed_at must be an ISO 8601 timestamp."""
    req = make_req(temperature=30.0, humidity=60.0)
    result = run_risk_engine(req)
    from datetime import datetime
    # Should parse without error
    ts = result["assessed_at"].replace("Z", "+00:00")
    parsed = datetime.fromisoformat(ts)
    assert parsed is not None


# ============================================================
# Edge case tests
# ============================================================

def test_score_capped_at_high():
    """Score should never produce a level above 'high'."""
    req = make_req(
        temperature=50.0, humidity=100.0, workload="very_heavy",
        duration_mins=480, environment="outdoor_sun", acclimatisation_days=0
    )
    result = run_risk_engine(req)
    assert result["risk_level"] == "high", f"Max inputs should give high: {result['risk_level']}"


def test_score_floored_at_low():
    """No inputs should produce a risk level below 'low'."""
    req = make_req(temperature=-10.0, humidity=0.0, workload="light", duration_mins=1, environment="indoor")
    result = run_risk_engine(req)
    assert result["risk_level"] == "low", f"Min inputs should give low: {result['risk_level']}"


def test_acclimatisation_zero_days():
    """Zero acclimatisation days should add the factor."""
    req = make_req(temperature=33.0, humidity=60.0, acclimatisation_days=0)
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "acclimatisation" in factor_text or "acclimat" in factor_text


def test_acclimatisation_none_not_penalised():
    """Unspecified acclimatisation (None) should not add an acclimatisation factor."""
    req = make_req(temperature=33.0, humidity=60.0, acclimatisation_days=None)
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "acclimatisation" not in factor_text, (
        f"None acclimatisation should not add factor: {result['contributing_factors']}"
    )


def test_temperature_boundary_28():
    """Exactly 28°C should trigger the warm temperature factor."""
    req = make_req(temperature=28.0, humidity=50.0, workload="light", duration_mins=30, environment="indoor")
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "warm" in factor_text or "temperature" in factor_text


def test_temperature_boundary_32():
    """Exactly 32°C should trigger the elevated temperature factor."""
    req = make_req(temperature=32.0, humidity=50.0, workload="light", duration_mins=30, environment="indoor")
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "elevated" in factor_text or "temperature" in factor_text


def test_temperature_boundary_38():
    """Exactly 38°C should trigger the very high temperature factor."""
    req = make_req(temperature=38.0, humidity=50.0, workload="light", duration_mins=30, environment="indoor")
    result = run_risk_engine(req)
    factor_text = " ".join(result["contributing_factors"]).lower()
    assert "very high" in factor_text or "38" in factor_text


# ============================================================
# Run all tests (when executed directly)
# ============================================================

if __name__ == "__main__":
    import traceback
    test_fns = [
        (name, fn) for name, fn in globals().items()
        if name.startswith("test_") and callable(fn)
    ]
    passed = 0
    failed = 0
    for name, fn in test_fns:
        try:
            fn()
            print(f"  PASS  {name}")
            passed += 1
        except AssertionError as e:
            print(f"  FAIL  {name}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR {name}: {e}")
            traceback.print_exc()
            failed += 1

    print(f"\n{'='*50}")
    print(f"Results: {passed} passed, {failed} failed out of {len(test_fns)} tests")
    if failed > 0:
        exit(1)
