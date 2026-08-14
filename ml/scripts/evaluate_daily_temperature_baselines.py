#!/usr/bin/env python
"""Evaluate daily persistence baselines for the approved researcher profile."""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from marea_ml.config import Config
from marea_ml.data.loader import load_temperature_csv
from marea_ml.evaluation.daily_baselines import evaluate_daily_baselines


ML_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ML_ROOT / "data" / "processed" / "temperature_series.csv"
DEFAULT_OUTPUT = ML_ROOT / "reports" / "metrics" / "daily_temperature_baselines.json"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    config = Config.load("daily_temperature_evaluation")
    report = evaluate_daily_baselines(
        load_temperature_csv(args.input),
        horizons_days=config["candidate_forecast_horizons_days"],
        seasonal_lag_days=config["seasonal_persistence_lag_days"],
        descriptive_quantiles=config["descriptive_upper_temperature_quantiles"],
    )
    report["dataset_id"] = config["dataset_id"]
    report["configured_risk_temperature_threshold"] = config["risk_temperature_threshold"]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(f"Saved daily baseline report to: {args.output}")
    for horizon, results in report["horizons"].items():
        seasonal = results["seasonal_persistence_365_days"]
        print(f"{horizon}-day seasonal persistence: MAE={seasonal['mae']:.6f}, RMSE={seasonal['rmse']:.6f}")


if __name__ == "__main__":
    main()
