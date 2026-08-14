"""Evaluation metrics for temperature forecasting.

Implements standard regression metrics (MAE, RMSE, R²) and domain-specific
metrics (threshold-event recall, false-alert rate, warning lead time).
"""

from typing import Tuple
import numpy as np
import pandas as pd


def mean_absolute_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Compute Mean Absolute Error.
    
    MAE = (1/n) * Σ|y_true - y_pred|
    
    Args:
        y_true: Ground truth values
        y_pred: Predictions
        
    Returns:
        MAE value
    """
    return np.mean(np.abs(y_true - y_pred))


def root_mean_squared_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Compute Root Mean Squared Error.
    
    RMSE = sqrt((1/n) * Σ(y_true - y_pred)²)
    
    Args:
        y_true: Ground truth values
        y_pred: Predictions
        
    Returns:
        RMSE value
    """
    return np.sqrt(np.mean((y_true - y_pred) ** 2))


def r_squared(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Compute R² (Coefficient of Determination).
    
    R² = 1 - (SS_res / SS_tot)
    where SS_res = Σ(y_true - y_pred)²
    and SS_tot = Σ(y_true - mean(y_true))²
    
    Args:
        y_true: Ground truth values
        y_pred: Predictions
        
    Returns:
        R² score (0-1 for perfect prediction, can be negative for poor models)
    """
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    
    return 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0


def threshold_event_recall(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    threshold: float
) -> float:
    """
    Compute recall for threshold exceedance events.
    
    For MAREA risk engine: what fraction of actual temperature exceedances
    did the model successfully predict?
    
    Args:
        y_true: Ground truth temperatures
        y_pred: Predictions
        threshold: Temperature threshold (e.g., 28.5°C)
        
    Returns:
        Recall value (0-1): TP / (TP + FN)
    """
    true_events = y_true >= threshold
    pred_events = y_pred >= threshold
    
    tp = np.sum(true_events & pred_events)
    fn = np.sum(true_events & ~pred_events)
    
    if (tp + fn) == 0:
        return 0.0  # No events in ground truth
    
    return tp / (tp + fn)


def false_alert_rate(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    threshold: float
) -> float:
    """
    Compute false-alert rate.
    
    What fraction of predicted exceedances were false alarms?
    
    Args:
        y_true: Ground truth temperatures
        y_pred: Predictions
        threshold: Temperature threshold
        
    Returns:
        False-alert rate (0-1): FP / (TP + FP)
    """
    true_events = y_true >= threshold
    pred_events = y_pred >= threshold
    
    tp = np.sum(true_events & pred_events)
    fp = np.sum(~true_events & pred_events)
    
    if (tp + fp) == 0:
        return 0.0  # No alerts predicted
    
    return fp / (tp + fp)


def warning_lead_time(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    threshold: float,
    timestep_minutes: int = 15
) -> float:
    """
    Compute average warning lead time for threshold exceedances.
    
    How many time steps (or minutes) ahead does the model predict exceedances?
    
    Args:
        y_true: Ground truth temperatures
        y_pred: Predictions
        threshold: Temperature threshold
        timestep_minutes: Duration of each timestep (default 15 minutes)
        
    Returns:
        Average lead time in hours
        
    Note:
        This simplified version assumes position indices correspond to forecast horizon.
        Full implementation requires datetime tracking.
    """
    # Simplified: assumes y_pred is already at forecast horizon
    # In practice, would need to correlate with actual event timing
    return 0.0  # Placeholder


def compute_metrics_report(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    threshold: float = 28.5,
    model_name: str = "Model"
) -> dict:
    """
    Generate comprehensive evaluation report.
    
    Args:
        y_true: Ground truth values
        y_pred: Predictions
        threshold: Temperature threshold for event metrics
        model_name: Name of model being evaluated
        
    Returns:
        Dictionary with all computed metrics
    """
    return {
        "model": model_name,
        "n_samples": len(y_true),
        "mae": mean_absolute_error(y_true, y_pred),
        "rmse": root_mean_squared_error(y_true, y_pred),
        "r2": r_squared(y_true, y_pred),
        "threshold_event_recall": threshold_event_recall(y_true, y_pred, threshold),
        "false_alert_rate": false_alert_rate(y_true, y_pred, threshold),
        "temperature_range": {
            "min": float(np.min(y_true)),
            "max": float(np.max(y_true)),
            "mean": float(np.mean(y_true))
        }
    }
