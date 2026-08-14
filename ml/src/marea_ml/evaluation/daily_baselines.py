"""Daily baseline evaluation for the researcher temperature profile.

The seasonal baseline deliberately uses a 365-day lag because the approved raw
source has an exact 365-row repetition. Its result is a data-structure finding,
not evidence that an advanced model generalizes to independent future years.
"""

from __future__ import annotations

from typing import Iterable

import numpy as np
import pandas as pd

from marea_ml.data.loader import audit_exact_temperature_lag_repetition
from marea_ml.evaluation.metrics import mean_absolute_error, root_mean_squared_error


def _metric_summary(actual: np.ndarray, predicted: np.ndarray, origin: np.ndarray) -> dict:
    """Return absolute-temperature and temperature-change errors."""
    return {
        "n_samples": int(len(actual)),
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(root_mean_squared_error(actual, predicted)),
        "temperature_change_mae": float(
            mean_absolute_error(actual - origin, predicted - origin)
        ),
        "temperature_change_rmse": float(
            root_mean_squared_error(actual - origin, predicted - origin)
        ),
    }


def _descriptive_groups(
    actual: np.ndarray,
    predicted: np.ndarray,
    origin: np.ndarray,
    quantiles: Iterable[float],
) -> list[dict]:
    """Summarize error for descriptive upper-temperature groups only."""
    groups = []
    for quantile in quantiles:
        cutoff = float(np.quantile(actual, quantile))
        selected = actual >= cutoff
        groups.append(
            {
                "quantile": float(quantile),
                "descriptive_temperature_cutoff": cutoff,
                "not_a_risk_threshold": True,
                **_metric_summary(actual[selected], predicted[selected], origin[selected]),
            }
        )
    return groups


def evaluate_daily_baselines(
    df: pd.DataFrame,
    horizons_days: Iterable[int] = (1, 3, 7),
    seasonal_lag_days: int = 365,
    descriptive_quantiles: Iterable[float] = (0.90, 0.95),
    timestamp_col: str = "timestamp",
    temperature_col: str = "temperature",
) -> dict:
    """Evaluate persistence and fixed-lag seasonal persistence on daily data."""
    if timestamp_col not in df.columns or temperature_col not in df.columns:
        raise ValueError("Daily baseline input requires timestamp and temperature columns")

    data = df[[timestamp_col, temperature_col]].copy()
    data[timestamp_col] = pd.to_datetime(data[timestamp_col], errors="raise")
    data[temperature_col] = pd.to_numeric(data[temperature_col], errors="raise")
    data = data.sort_values(timestamp_col).reset_index(drop=True)
    if not data[timestamp_col].diff().dropna().eq(pd.Timedelta(days=1)).all():
        raise ValueError("Daily baseline evaluation requires a strictly daily series")

    values = data[temperature_col].to_numpy(dtype=float)
    timestamps = data[timestamp_col].to_numpy()
    repetition_audit = audit_exact_temperature_lag_repetition(
        data, lag_rows=seasonal_lag_days, temperature_col=temperature_col
    )
    horizon_reports = {}
    for horizon in horizons_days:
        if horizon <= 0:
            raise ValueError("Forecast horizons must be positive days")
        if len(values) <= max(horizon, seasonal_lag_days):
            raise ValueError("Dataset is too short for the requested daily baseline")

        persistence_actual = values[horizon:]
        persistence_predicted = values[:-horizon]
        target_indices = np.arange(seasonal_lag_days, len(values))
        seasonal_actual = values[target_indices]
        seasonal_predicted = values[target_indices - seasonal_lag_days]
        seasonal_origin = values[target_indices - horizon]
        seasonal = _metric_summary(seasonal_actual, seasonal_predicted, seasonal_origin)
        seasonal["target_date_start"] = str(pd.Timestamp(timestamps[target_indices[0]]).date())
        seasonal["target_date_end"] = str(pd.Timestamp(timestamps[target_indices[-1]]).date())
        seasonal["descriptive_upper_temperature_groups"] = _descriptive_groups(
            seasonal_actual, seasonal_predicted, seasonal_origin, descriptive_quantiles
        )
        horizon_reports[str(horizon)] = {
            "horizon_days": int(horizon),
            "persistence": _metric_summary(
                persistence_actual, persistence_predicted, persistence_predicted
            ),
            "seasonal_persistence_365_days": seasonal,
        }

    return {
        "dataset_rows": int(len(data)),
        "date_range": [str(data[timestamp_col].iloc[0].date()), str(data[timestamp_col].iloc[-1].date())],
        "sampling_frequency": "daily",
        "fixed_row_repetition_audit": repetition_audit,
        "risk_temperature_threshold": None,
        "horizons": horizon_reports,
        "scientific_interpretation": (
            "An exact 365-day seasonal-persistence result demonstrates the deterministic "
            "annual-cycle structure of this supplied dataset. It is not independent-year "
            "generalization evidence and does not justify feature-model or LSTM training "
            "on this dataset alone."
        ),
    }
