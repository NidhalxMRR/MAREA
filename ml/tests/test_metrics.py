"""Tests for evaluation metrics module."""

import pytest
import numpy as np
from marea_ml.evaluation.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r_squared,
    threshold_event_recall,
    false_alert_rate
)


def test_mean_absolute_error():
    """Test MAE calculation."""
    y_true = np.array([1.0, 2.0, 3.0, 4.0])
    y_pred = np.array([1.1, 1.9, 3.2, 3.8])
    
    mae = mean_absolute_error(y_true, y_pred)
    expected = (0.1 + 0.1 + 0.2 + 0.2) / 4
    assert np.isclose(mae, expected)


def test_root_mean_squared_error():
    """Test RMSE calculation."""
    y_true = np.array([1.0, 2.0, 3.0])
    y_pred = np.array([1.5, 2.5, 3.5])
    
    rmse = root_mean_squared_error(y_true, y_pred)
    # RMSE is the square root of the mean squared error, not the sum.
    expected = np.sqrt(np.mean([0.25, 0.25, 0.25]))
    assert np.isclose(rmse, expected)


def test_r_squared():
    """Test R² score."""
    y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y_pred = np.array([1.1, 2.1, 2.9, 3.9, 5.1])
    
    r2 = r_squared(y_true, y_pred)
    assert 0 < r2 <= 1  # Good prediction


def test_r_squared_perfect():
    """Test R² score for perfect prediction."""
    y_true = np.array([1.0, 2.0, 3.0])
    y_pred = y_true.copy()
    
    r2 = r_squared(y_true, y_pred)
    assert np.isclose(r2, 1.0)


def test_threshold_event_recall():
    """Test threshold event recall."""
    y_true = np.array([27.0, 28.0, 29.0, 30.0, 26.0])
    y_pred = np.array([27.5, 28.5, 28.5, 30.5, 25.5])
    threshold = 28.5
    
    # Events: indices 1, 2, 3 in y_true (values >= 28.5)
    # Predicted: indices 1, 2, 3 in y_pred (values >= 28.5)
    recall = threshold_event_recall(y_true, y_pred, threshold)
    
    # All 3 events correctly predicted: recall = 1.0
    assert np.isclose(recall, 1.0)


def test_false_alert_rate():
    """Test false-alert rate."""
    y_true = np.array([27.0, 28.0, 29.0])
    y_pred = np.array([29.0, 29.0, 29.0])  # All predict event
    threshold = 28.5
    
    # True event: index 2 only; 28.0 is below the 28.5 threshold.
    # Predicted events: all 3
    # TP = 1, FP = 2
    # FAR = FP / (TP + FP) = 2/3
    far = false_alert_rate(y_true, y_pred, threshold)
    assert np.isclose(far, 2.0 / 3.0)
