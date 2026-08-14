"""MAREA ML — Machine Learning module for sea-temperature forecasting.

This package provides tools for data validation, feature engineering,
baseline forecasting, and LSTM-based temperature prediction for
marine aquaculture early-warning systems.

Main Components:
  - data: Data loading and validation
  - features: Feature engineering for time-series
  - models: Baseline and neural network models
  - evaluation: Metric computation and model comparison
  - inference: Production prediction interface

Usage:
  >>> from marea_ml.data import loader
  >>> df = loader.load_temperature_csv('data/raw/bizerte.csv')
  >>> from marea_ml.inference import predictor
  >>> pred = predictor.predict_temperature(df, hours_ahead=6)
"""

__version__ = "0.1.0"
__author__ = "MAREA Team"
__license__ = "MIT"
