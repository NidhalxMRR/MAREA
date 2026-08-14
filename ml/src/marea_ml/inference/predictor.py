"""Production inference interface for MAREA backend.

Provides a common prediction interface for models trained in notebooks.
Can load and use persistence, feature-based, or LSTM models.
"""

from typing import Optional, Dict, Any
import numpy as np
import pandas as pd


class TemperaturePredictor:
    """
    Unified interface for temperature forecasting.
    
    Handles:
    - Model loading (persistence, feature-based, LSTM)
    - Input preprocessing (scaling, windowing)
    - Batch prediction
    - Uncertainty quantification (if available)
    
    Example:
        >>> predictor = TemperaturePredictor.from_config('lstm_v001')
        >>> future_temps = predictor.predict_batch(recent_data, horizons=[1, 6, 24])
        >>> alerts = predictor.generate_alerts(future_temps, threshold=28.5)
    """
    
    def __init__(
        self,
        model: Any,
        scaler: Optional[Any] = None,
        lookback_steps: int = 48,
        model_type: str = "unknown"
    ):
        """
        Initialize predictor.
        
        Args:
            model: Trained model object (persistence, feature model, or LSTM)
            scaler: Optional StandardScaler for temperature normalization
            lookback_steps: Historical context window (e.g., 48 for 12 hours)
            model_type: Type of model ('persistence', 'feature', 'lstm')
        """
        self.model = model
        self.scaler = scaler
        self.lookback_steps = lookback_steps
        self.model_type = model_type
    
    def predict(
        self,
        recent_temperatures: np.ndarray or pd.Series,
        horizon_steps: int = 4
    ) -> Dict[str, Any]:
        """
        Generate a single forecast.
        
        Args:
            recent_temperatures: Recent observed temperatures (numpy array or pandas Series)
            horizon_steps: Forecast horizon in steps (e.g., 4 for +1 hour at 15-min sampling)
            
        Returns:
            Dictionary with:
            - 'prediction': Forecasted temperature
            - 'model': Model type used
            - 'horizon_steps': Forecast horizon
        """
        # Future implementation will:
        # 1. Validate input shape
        # 2. Apply scaler if needed
        # 3. Call model.predict()
        # 4. Inverse-scale if needed
        # 5. Return structured result
        raise NotImplementedError("Inference interface to be implemented during notebooks phase.")
    
    def predict_batch(
        self,
        df: pd.DataFrame,
        temperature_col: str = "temperature",
        horizons_steps: list = None
    ) -> pd.DataFrame:
        """
        Generate batch predictions for multiple horizons.
        
        Args:
            df: DataFrame with temperature time series
            temperature_col: Name of temperature column
            horizons_steps: List of forecast horizons (e.g., [4, 12, 24])
            
        Returns:
            DataFrame with predictions for each horizon
        """
        if horizons_steps is None:
            horizons_steps = [4, 12, 24]
        
        raise NotImplementedError("Batch inference to be implemented during notebooks phase.")
    
    def generate_alerts(
        self,
        predictions: np.ndarray or pd.DataFrame,
        threshold: float = 28.5,
        minimum_confidence: float = 0.7
    ) -> list:
        """
        Generate risk alerts based on predictions.
        
        Args:
            predictions: Model predictions
            threshold: Temperature threshold (°C) for alert
            minimum_confidence: Minimum prediction confidence for alert
            
        Returns:
            List of alert objects with timestamp, predicted temp, severity, etc.
        """
        raise NotImplementedError("Alert generation to be implemented during risk-engine phase.")
    
    @classmethod
    def from_config(cls, config_name: str) -> 'TemperaturePredictor':
        """
        Load predictor from configuration and model files.
        
        Args:
            config_name: Name of model config (e.g., 'lstm_v001', 'feature_v002')
            
        Returns:
            TemperaturePredictor instance
        """
        # Future: load model from models/ directory, scaler, config
        raise NotImplementedError("Config-based loading to be implemented during deployment phase.")
