"""Temperature feature engineering for time-series forecasting.

This module creates lag features, rolling statistics, and other domain features
for feature-based baseline models.
"""

from typing import List
import pandas as pd
import numpy as np


def create_lag_features(
    df: pd.DataFrame,
    temperature_col: str = "temperature",
    lag_steps: List[int] = None
) -> pd.DataFrame:
    """
    Create lagged temperature features.
    
    Args:
        df: DataFrame with temperature column
        temperature_col: Name of temperature column
        lag_steps: List of lag values (e.g., [1, 4, 24] for 15-min, 1-hour, 6-hour lags)
        
    Returns:
        DataFrame with original and lag features (NaN rows removed)
    """
    if lag_steps is None:
        lag_steps = [1, 4, 12, 24]
    
    df = df.copy()
    for lag in lag_steps:
        df[f"temp_lag_{lag}"] = df[temperature_col].shift(lag)
    
    return df.dropna()


def create_rolling_features(
    df: pd.DataFrame,
    temperature_col: str = "temperature",
    windows: List[int] = None
) -> pd.DataFrame:
    """
    Create rolling mean and standard deviation features.
    
    Args:
        df: DataFrame with temperature column
        temperature_col: Name of temperature column
        windows: List of rolling window sizes (e.g., [4, 12, 24] for 1-hour, 3-hour, 6-hour)
        
    Returns:
        DataFrame with rolling statistics (NaN rows removed)
    """
    if windows is None:
        windows = [4, 12, 24]
    
    df = df.copy()
    for window in windows:
        df[f"temp_rolling_mean_{window}"] = df[temperature_col].rolling(window=window).mean()
        df[f"temp_rolling_std_{window}"] = df[temperature_col].rolling(window=window).std()
    
    return df.dropna()


def create_rate_of_change_feature(
    df: pd.DataFrame,
    temperature_col: str = "temperature",
    window: int = 1
) -> pd.DataFrame:
    """
    Create rate of change (delta) features.
    
    Args:
        df: DataFrame with temperature column
        temperature_col: Name of temperature column
        window: Number of steps for diff (default 1 for per-step change)
        
    Returns:
        DataFrame with rate-of-change features
    """
    df = df.copy()
    df["temp_roc"] = df[temperature_col].diff(window)
    return df.dropna()


def create_cyclical_time_features(
    df: pd.DataFrame,
    timestamp_col: str = "timestamp"
) -> pd.DataFrame:
    """
    Create cyclical time features (hour, day of week, day of year).
    
    These capture periodic patterns relevant to temperature (daily/seasonal cycles).
    
    Args:
        df: DataFrame with timestamp column
        timestamp_col: Name of timestamp column
        
    Returns:
        DataFrame with cyclical features
    """
    df = df.copy()
    
    # Hour of day (0-23)
    df["hour"] = df[timestamp_col].dt.hour
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    
    # Day of week (0-6)
    df["dayofweek"] = df[timestamp_col].dt.dayofweek
    df["dayofweek_sin"] = np.sin(2 * np.pi * df["dayofweek"] / 7)
    df["dayofweek_cos"] = np.cos(2 * np.pi * df["dayofweek"] / 7)
    
    # Day of year (0-365)
    df["dayofyear"] = df[timestamp_col].dt.dayofyear
    df["dayofyear_sin"] = np.sin(2 * np.pi * df["dayofyear"] / 365)
    df["dayofyear_cos"] = np.cos(2 * np.pi * df["dayofyear"] / 365)
    
    return df


def create_all_temperature_features(
    df: pd.DataFrame,
    temperature_col: str = "temperature",
    timestamp_col: str = "timestamp",
    lag_steps: List[int] = None,
    rolling_windows: List[int] = None
) -> pd.DataFrame:
    """
    Create all available temperature features.
    
    Combines lag, rolling, rate-of-change, and cyclical features.
    
    Args:
        df: DataFrame with temperature and timestamp columns
        temperature_col: Name of temperature column
        timestamp_col: Name of timestamp column
        lag_steps: Custom lag values (default: [1, 4, 12, 24])
        rolling_windows: Custom rolling windows (default: [4, 12, 24])
        
    Returns:
        DataFrame with all engineered features (NaN rows removed)
    """
    df = df.copy()
    
    # Lag features
    df = create_lag_features(df, temperature_col, lag_steps)
    
    # Rolling features
    df = create_rolling_features(df, temperature_col, rolling_windows)
    
    # Rate of change
    df = create_rate_of_change_feature(df, temperature_col)
    
    # Cyclical time features
    df = create_cyclical_time_features(df, timestamp_col)
    
    return df.dropna()
