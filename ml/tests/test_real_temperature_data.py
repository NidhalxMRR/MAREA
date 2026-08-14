from pathlib import Path

import pandas as pd

from marea_ml.data.loader import (
    audit_exact_temperature_lag_repetition,
    load_temperature_excel,
)


def test_load_temperature_excel_extracts_temperature_only(tmp_path):
    """The real researcher dataset should be read from Excel and normalized to timestamp/temperature columns."""
    path = tmp_path / "temperature_data.xlsx"

    df = pd.DataFrame(
        {
            "Date": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"],
            "Other": ["x", "y", "z", "w"],
            "T (°C)": ["22.1", "", "23.4", "NA"],
            "O2 (mg/l)": [7.2, 6.9, 7.1, 7.0],
        }
    )
    df.to_excel(path, index=False)

    loaded = load_temperature_excel(path)

    assert list(loaded.columns) == ["timestamp", "temperature"]
    assert loaded["temperature"].notna().all()
    assert loaded["temperature"].dtype.kind in "if"
    assert loaded["timestamp"].is_monotonic_increasing


def test_load_temperature_excel_uses_temperature_column_aliases(tmp_path):
    """The loader should accept common temperature naming variants used by field datasets."""
    path = tmp_path / "temp_alias.xlsx"

    df = pd.DataFrame(
        {
            "Date": ["2024-01-05", "2024-01-06", "2024-01-07"],
            "Temperature": [19.8, 20.0, 21.2],
        }
    )
    df.to_excel(path, index=False)

    loaded = load_temperature_excel(path)

    assert list(loaded.columns) == ["timestamp", "temperature"]
    assert loaded["temperature"].tolist() == [19.8, 20.0, 21.2]


def test_temperature_repetition_audit_detects_exact_fixed_lag_cycle():
    df = pd.DataFrame({"temperature": [11.0, 12.0, 13.0] * 3})

    audit = audit_exact_temperature_lag_repetition(df, lag_rows=3)

    assert audit == {
        "lag_rows": 3,
        "compared_pairs": 6,
        "matching_pairs": 6,
        "exact_repetition_detected": True,
    }
