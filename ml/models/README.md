# Trained Models

This directory contains trained model files for sea-temperature forecasting.

## File Naming Convention

Models follow a versioned naming scheme:

```
{model_type}_{model_name}_v{version:03d}.{extension}
```

**Examples:**
- `temperature_lstm_v001.keras` — LSTM model version 1
- `temperature_feature_v001.joblib` — Feature-based model version 1
- `temperature_persistence_v001.pkl` — Persistence baseline

## Model Metadata

Each model has an accompanying **metadata JSON file** with identical base name:

```
temperature_lstm_v001_metadata.json
```

**Metadata contents:**
```json
{
  "model_name": "temperature_lstm_v001",
  "model_type": "LSTM",
  "training_date": "2026-08-14",
  "dataset_version": "bizerte_v1",
  "dataset_hash": "abc123...",
  "training_date_range": ["2024-01-01", "2024-12-31"],
  "validation_date_range": ["2025-01-01", "2025-03-31"],
  "test_date_range": ["2025-04-01", "2025-06-30"],
  "features": ["temp_lag_1", "temp_lag_4", "temp_rolling_mean_24"],
  "lookback_window_steps": 48,
  "forecast_horizon_hours": 6,
  "mae": 0.45,
  "rmse": 0.62,
  "r2": 0.87,
  "threshold_temperature": 28.5,
  "threshold_event_recall": 0.92,
  "false_alert_rate": 0.08
}
```

## Using Models in Production

See [inference/predictor.py](../src/marea_ml/inference/predictor.py) for loading and prediction interface:

```python
from marea_ml.inference import predictor

# Load model
p = predictor.TemperaturePredictor.from_config('lstm_v001')

# Generate forecast
forecast = p.predict(recent_temperatures, horizon_steps=4)

# Generate alerts
alerts = p.generate_alerts(forecast, threshold=28.5)
```

## Gitignore Policy

All model binaries are gitignored:
- `.keras`
- `.h5`
- `.pt`, `.pth`
- `.joblib`
- `.pkl`

**Keep tracked:**
- This README.md
- Metadata JSON files (optional, can be gitignored if very large)

This ensures reproducible deployments: models are trained in CI/CD or downloaded from a model registry, never committed to the repository.

---

## Next Steps

Models will be generated during the notebook phase:
1. Baselines trained in `notebooks/03_baselines.ipynb`
2. Feature model trained in `notebooks/04_feature_model.ipynb`
3. LSTM trained in `notebooks/05_lstm.ipynb`
4. Best model selected in `notebooks/06_evaluation.ipynb`
