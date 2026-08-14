"""Tests for preprocessing module."""

import pytest
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from marea_ml.data.preprocessing import (
    create_train_val_test_split,
    fit_temperature_scaler,
    scale_temperatures,
    create_sliding_windows
)


def test_create_train_val_test_split():
    """Test chronological train/val/test split."""
    n = 100
    df = pd.DataFrame({
        "timestamp": pd.date_range("2024-01-01", periods=n),
        "temperature": np.random.normal(20, 2, n)
    })
    
    train, val, test = create_train_val_test_split(df, train_ratio=0.6, val_ratio=0.2, test_ratio=0.2)
    
    assert len(train) == 60
    assert len(val) == 20
    assert len(test) == 20
    
    # Verify chronological order
    assert train.iloc[-1]["timestamp"] < val.iloc[0]["timestamp"]
    assert val.iloc[-1]["timestamp"] < test.iloc[0]["timestamp"]


def test_fit_temperature_scaler():
    """Test scaler fitting on training data."""
    train_df = pd.DataFrame({
        "temperature": [20.0, 21.0, 22.0, 23.0, 24.0]
    })
    
    scaler = fit_temperature_scaler(train_df)
    assert isinstance(scaler, StandardScaler)
    
    # Check mean and std are fitted
    assert hasattr(scaler, "mean_")
    assert hasattr(scaler, "scale_")


def test_scale_temperatures():
    """Test temperature scaling."""
    train_df = pd.DataFrame({"temperature": [20.0, 22.0, 24.0]})
    scaler = fit_temperature_scaler(train_df)
    
    test_df = pd.DataFrame({"temperature": [21.0, 23.0]})
    scaled = scale_temperatures(test_df, scaler)
    
    # Check values are scaled
    assert scaled["temperature"].mean() != test_df["temperature"].mean()


def test_create_sliding_windows():
    """Test sliding window generation."""
    n = 20
    df = pd.DataFrame({
        "temperature": np.arange(n, dtype=float)
    })
    
    X, y = create_sliding_windows(df, lookback_steps=5, forecast_horizon_steps=1)
    
    # With lookback=5, horizon=1: n - 5 - 1 + 1 = n - 5 samples
    assert X.shape[0] == n - 5
    assert y.shape[0] == n - 5
    assert X.shape[1] == 5
    
    # Verify first window
    np.testing.assert_array_equal(X[0], [0, 1, 2, 3, 4])
    assert y[0] == 5
