"""Feature-based forecasting model interface.

Wrapper for sklearn-compatible regressors (Linear, Tree, etc.) with
lag and rolling features.
"""

from typing import Optional
import numpy as np
from sklearn.base import BaseEstimator, RegressorMixin


class FeatureBasedForecaster(BaseEstimator, RegressorMixin):
    """
    Feature-based temperature forecaster using sklearn-compatible model.
    
    This is a wrapper that accepts any sklearn regressor and applies it to
    engineered lag and rolling features.
    
    Supported models:
    - LinearRegression
    - Ridge / Lasso
    - DecisionTreeRegressor
    - RandomForestRegressor
    - GradientBoostingRegressor (if installed)
    """
    
    def __init__(self, model: BaseEstimator):
        """
        Initialize feature-based forecaster.
        
        Args:
            model: Any sklearn-compatible regressor with fit() and predict() methods
        """
        self.model = model
        self._is_fitted = False
    
    def fit(self, X_train: np.ndarray, y_train: np.ndarray) -> 'FeatureBasedForecaster':
        """
        Fit the underlying model.
        
        Args:
            X_train: Training features of shape (n_samples, n_features)
            y_train: Training targets of shape (n_samples,)
            
        Returns:
            self
        """
        self.model.fit(X_train, y_train)
        self._is_fitted = True
        return self
    
    def predict(self, X_test: np.ndarray) -> np.ndarray:
        """
        Generate predictions.
        
        Args:
            X_test: Test features of shape (n_samples, n_features)
            
        Returns:
            Predictions of shape (n_samples,)
        """
        if not self._is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        return self.model.predict(X_test)
    
    def get_feature_importance(self) -> Optional[np.ndarray]:
        """
        Return feature importance if available (e.g., tree-based models).
        
        Returns:
            Feature importances or None if not supported by model
        """
        if hasattr(self.model, 'feature_importances_'):
            return self.model.feature_importances_
        elif hasattr(self.model, 'coef_'):
            return np.abs(self.model.coef_)
        return None
