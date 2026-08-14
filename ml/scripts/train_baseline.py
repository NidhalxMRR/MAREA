#!/usr/bin/env python
"""Train and evaluate baseline forecasting models.

Implements persistence and statistical baselines for temperature forecasting.

Usage:
  python scripts/train_baseline.py --input data/processed/train.csv
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from marea_ml.data.loader import load_temperature_csv
from marea_ml.models.persistence import PersistenceForecaster
from marea_ml.evaluation.metrics import compute_metrics_report
from marea_ml.config import Config
import json
import argparse


def main():
    """Train baseline models."""
    parser = argparse.ArgumentParser(description="Train baseline forecasting models")
    parser.add_argument("--input", type=str, required=True, help="Input CSV or Excel file")
    parser.add_argument("--output", type=str, default="reports/baseline_results.json", help="Output JSON report")
    
    args = parser.parse_args()
    
    config = Config.load("data")
    temperature_col = config.get("temperature_column", "temperature")
    
    print("Loading data...")
    input_path = Path(args.input)
    if input_path.suffix.lower() in {'.xlsx', '.xls'}:
        from marea_ml.data.loader import load_temperature_excel
        df = load_temperature_excel(input_path)
    else:
        df = load_temperature_csv(args.input, temperature_col=temperature_col)
    
    # Dummy train/test split
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]
    
    # Train persistence baseline
    print("Training persistence baseline...")
    persistence = PersistenceForecaster()
    persistence.fit(None, None)  # No training needed
    
    # Generate predictions
    X_test = test_df[[temperature_col]].values[:-1]  # All but last
    y_test = test_df[[temperature_col]].values[1:]   # Shift by 1
    
    y_pred = persistence.predict(X_test)
    
    # Evaluate
    report = compute_metrics_report(y_test.flatten(), y_pred, model_name="PersistenceBaseline")
    
    # Save
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"Results saved to: {output_path}")
    print(f"MAE: {report['mae']:.4f}")
    print(f"RMSE: {report['rmse']:.4f}")


if __name__ == "__main__":
    main()
