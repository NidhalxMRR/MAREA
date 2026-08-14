"""Tests for data validation module."""

import pytest
import pandas as pd
import numpy as np
from marea_ml.data.validation import (
    check_duplicated_timestamps,
    check_missing_timestamps,
    check_missing_values,
    check_invalid_temperatures
)


def test_check_duplicated_timestamps():
    """Test duplicate timestamp detection."""
    df = pd.DataFrame({
        "timestamp": pd.date_range("2024-01-01", periods=5),
        "temperature": [20.5, 21.0, 21.5, 21.0, 22.0]
    })
    
    has_dups, count = check_duplicated_timestamps(df)
    assert not has_dups
    assert count == 0
    
    # Add duplicate
    df_dup = pd.concat([df, df.iloc[[0]]], ignore_index=True)
    has_dups, count = check_duplicated_timestamps(df_dup)
    assert has_dups
    assert count > 0


def test_check_missing_timestamps():
    """Test gap detection."""
    # Regular timestamps
    df = pd.DataFrame({
        "timestamp": pd.date_range("2024-01-01", periods=5, freq="15min"),
        "temperature": [20.5, 21.0, 21.5, 21.0, 22.0]
    })
    
    has_gaps, gaps = check_missing_timestamps(df, expected_interval_minutes=15)
    assert not has_gaps
    
    # With gap
    timestamps = [
        pd.Timestamp("2024-01-01 00:00"),
        pd.Timestamp("2024-01-01 00:15"),
        pd.Timestamp("2024-01-01 00:45"),  # Skip 30 min
        pd.Timestamp("2024-01-01 01:00"),
    ]
    df_gap = pd.DataFrame({
        "timestamp": timestamps,
        "temperature": [20.5, 21.0, 21.5, 21.0]
    })
    
    has_gaps, gaps = check_missing_timestamps(df_gap, expected_interval_minutes=15)
    assert has_gaps
    assert len(gaps) > 0


def test_check_missing_values():
    """Test missing value counting."""
    df = pd.DataFrame({
        "timestamp": pd.date_range("2024-01-01", periods=5),
        "temperature": [20.5, np.nan, 21.5, 21.0, np.nan]
    })
    
    missing = check_missing_values(df)
    assert missing["temperature"] == 2
    assert missing["timestamp"] == 0


def test_check_invalid_temperatures():
    """Test invalid temperature detection."""
    df = pd.DataFrame({
        "temperature": [20.5, 21.0, -10.0, 50.0, 22.0]  # -10 and 50 outside default range
    })
    
    has_invalid, count = check_invalid_temperatures(df, valid_range=(-5.0, 45.0))
    assert has_invalid
    assert count == 2
