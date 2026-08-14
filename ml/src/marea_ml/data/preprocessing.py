"""Data preprocessing and transformation.

This module handles cleaning, scaling, and windowing of time-series data.

**Important**: All preprocessing parameters (scalers, normalization constants)
must be fitted ONLY on the training set to prevent data leakage.
"""

from typing import Tuple, Optional
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler


def create_train_val_test_split(
    df: pd.DataFrame,
    train_ratio: float = 0.6,
    val_ratio: float = 0.2,
    test_ratio: float = 0.2,
    timestamp_col: str = "timestamp"
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Chronologically split data into train/val/test sets.
    
    Args:
        df: DataFrame sorted by timestamp
        train_ratio: Fraction for training (default 60%)
        val_ratio: Fraction for validation (default 20%)
        test_ratio: Fraction for testing (default 20%)
        timestamp_col: Name of timestamp column
        
    Returns:
        Tuple of (train_df, val_df, test_df)
        
    Note:
        Ratios must sum to 1.0. Uses chronological order (no shuffling).
    """
    if not np.isclose(train_ratio + val_ratio + test_ratio, 1.0):
        raise ValueError("Ratios must sum to 1.0")
    
    n = len(df)
    train_idx = int(n * train_ratio)
    val_idx = int(n * (train_ratio + val_ratio))
    
    train_df = df.iloc[:train_idx].copy()
    val_df = df.iloc[train_idx:val_idx].copy()
    test_df = df.iloc[val_idx:].copy()
    
    return train_df, val_df, test_df


def fit_temperature_scaler(
    train_df: pd.DataFrame,
    temperature_col: str = "temperature"
) -> StandardScaler:
    """
    Fit a StandardScaler on training data only.
    
    Args:
        train_df: Training DataFrame
        temperature_col: Name of temperature column
        
    Returns:
        Fitted StandardScaler object
        
    Warning:
        This scaler should be applied to validation/test data but NEVER re-fit.
    """
    scaler = StandardScaler()
    scaler.fit(train_df[[temperature_col]])
    return scaler


def scale_temperatures(
    df: pd.DataFrame,
    scaler: StandardScaler,
    temperature_col: str = "temperature"
) -> pd.DataFrame:
    """
    Apply pre-fitted scaler to temperature column.
    
    Args:
        df: DataFrame to scale
        scaler: Pre-fitted StandardScaler
        temperature_col: Name of temperature column
        
    Returns:
        DataFrame with scaled temperatures
    """
    df = df.copy()
    df[temperature_col] = scaler.transform(df[[temperature_col]])
    return df


def create_sliding_windows(
    df: pd.DataFrame,
    lookback_steps: int,
    forecast_horizon_steps: int,
    temperature_col: str = "temperature"
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Create sliding window dataset for LSTM or sequence models.
    
    Args:
        df: DataFrame sorted by timestamp
        lookback_steps: Number of historical steps as input (e.g., 48 for 12 hours)
        forecast_horizon_steps: Number of steps ahead to predict (e.g., 4 for 1 hour)
        temperature_col: Name of temperature column
        
    Returns:
        Tuple of (X, y) where:
        - X shape: (n_samples, lookback_steps)
        - y shape: (n_samples,)
    """
    temps = df[temperature_col].values
    X, y = [], []
    
    for i in range(len(temps) - lookback_steps - forecast_horizon_steps + 1):
        X.append(temps[i:i + lookback_steps])
        y.append(temps[i + lookback_steps + forecast_horizon_steps - 1])
    
    return np.array(X), np.array(y)
