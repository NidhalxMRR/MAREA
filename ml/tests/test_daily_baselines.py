import pandas as pd

from marea_ml.evaluation.daily_baselines import evaluate_daily_baselines


def test_daily_baselines_report_exact_seasonal_cycle_without_risk_threshold():
    cycle = [10.0, 12.0, 11.0, 14.0]
    df = pd.DataFrame(
        {
            "timestamp": pd.date_range("2020-01-01", periods=12, freq="D"),
            "temperature": cycle * 3,
        }
    )

    report = evaluate_daily_baselines(
        df,
        horizons_days=(1, 3),
        seasonal_lag_days=4,
        descriptive_quantiles=(0.75,),
    )

    assert report["sampling_frequency"] == "daily"
    assert report["risk_temperature_threshold"] is None
    assert report["fixed_row_repetition_audit"]["exact_repetition_detected"]
    for horizon in ("1", "3"):
        seasonal = report["horizons"][horizon]["seasonal_persistence_365_days"]
        assert seasonal["mae"] == 0.0
        assert seasonal["rmse"] == 0.0
        assert seasonal["descriptive_upper_temperature_groups"][0]["not_a_risk_threshold"]
