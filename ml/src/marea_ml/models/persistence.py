"""Persistence (naive) baseline model.

The simplest possible forecast: next temperature = most recent observed temperature.
This trivial baseline establishes a lower bound for any forecasting approach.
"""

import pandas as pd
import numpy as np


class PersistenceForecaster:
    """
    Persistence baseline: predict most recent value.
    
    For temperature prediction:
        forecast_t+h = temperature_t
    
    Always required as sanity check. Any model must beat this.
    """
    
    def __init__(self):
        """Initialize persistence forecaster."""
        pass
    
    def fit(self, X_train: pd.DataFrame or np.ndarray, y_train: pd.DataFrame or np.ndarray):
        """
        Fit method (does nothing for persistence baseline).
        
        Args:
            X_train: Training features (unused)
            y_train: Training targets (unused)
        """
        pass  # Persistence baseline requires no training
    
    def predict(self, X_test: pd.DataFrame or np.ndarray) -> np.ndarray:
        """
        Generate persistence forecasts.
        
        For each sample, return the most recent temperature (last value of lookback window).
        
        Args:
            X_test: Test features of shape (n_samples, lookback_steps)
                   or DataFrame with temperature column
            
        Returns:
            Array of predictions (most recent value for each sample)
        """
        if isinstance(X_test, pd.DataFrame):
            # If DataFrame, return last value of temperature column per row
            return X_test.iloc[:, -1].values
        else:
            # If numpy array, return last step of each lookback window
            return X_test[:, -1]
    
    def score(self, X_test: np.ndarray, y_true: np.ndarray) -> float:
        """
        Compute R² score.
        
        Args:
            X_test: Test features
            y_true: True target values
            
        Returns:
            R² score (coefficient of determination)
        """
        y_pred = self.predict(X_test)
        
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        
        return 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
