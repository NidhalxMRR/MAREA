# Notebooks

This directory contains Jupyter notebooks for the MAREA ML workflow.

## Workflow

The notebooks should be executed in numerical order:

1. **`01_data_audit.ipynb`** - Raw data inspection
2. **`02_exploration.ipynb`** - Statistical and temporal analysis
3. **`03_baselines.ipynb`** - Baseline model evaluation
4. **`04_feature_model.ipynb`** - Feature-based ML model development
5. **`05_lstm.ipynb`** - LSTM training (only if baselines justify)
6. **`06_evaluation.ipynb`** - Final model comparison

## Running Locally

```bash
cd ml
jupyter notebook
```

## Running in Google Colab

Each notebook uses relative paths and environment detection to support Colab:

1. Open notebook in Colab
2. Mount Google Drive if needed
3. Run cells sequentially

## Saving Output

- Charts: Save to `../reports/figures/`
- Metrics: Save to `../reports/metrics/`
- Processed data: Save to `../data/processed/`

**Never modify data in `../data/raw/` directly.**
