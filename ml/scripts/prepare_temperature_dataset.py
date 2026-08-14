#!/usr/bin/env python
"""Prepare the researcher temperature dataset for ML training.

This script extracts the real research Excel files, sanitizes the temperature values,
and stores a clean temperature-only dataset for training and prediction.
"""

import sys
import warnings
from pathlib import Path
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from marea_ml.data.loader import (
    audit_exact_temperature_lag_repetition,
    load_temperature_excel,
)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RAW_DIR = DATA_DIR / "raw" / "Data_modele_to_Bassiana" / "Data_modele_to_Bassiana"
SOURCE_WORKBOOK = RAW_DIR / "Wat_physico_chemical_range.xlsx"
SOURCE_SHEET = "Physico_Chemical"
SOURCE_TIMESTAMP_COLUMN = "Date"
SOURCE_TEMPERATURE_COLUMN = "T (°C)"
SOURCE_SAMPLING_FREQUENCY = "daily"
REPETITION_AUDIT_LAG_ROWS = 365
OUT_FILE = DATA_DIR / "processed" / "temperature_series.csv"


def main() -> None:
    if not SOURCE_WORKBOOK.exists():
        raise FileNotFoundError(f"Approved source workbook not found: {SOURCE_WORKBOOK}")

    combined = load_temperature_excel(
        SOURCE_WORKBOOK,
        preferred_sheet=SOURCE_SHEET,
        source_timestamp_col=SOURCE_TIMESTAMP_COLUMN,
        source_temperature_col=SOURCE_TEMPERATURE_COLUMN,
    )
    if combined["timestamp"].duplicated().any():
        raise ValueError("Approved source contains duplicate timestamps")

    repetition_audit = audit_exact_temperature_lag_repetition(
        combined,
        lag_rows=REPETITION_AUDIT_LAG_ROWS,
    )
    if repetition_audit["exact_repetition_detected"]:
        warnings.warn(
            "PROVENANCE WARNING: temperature values repeat exactly every "
            f"{REPETITION_AUDIT_LAG_ROWS} rows. This dataset is not approved "
            "for operational forecasting until researcher clarification.",
            stacklevel=1,
        )

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    combined.to_csv(OUT_FILE, index=False)
    print(f"Saved temperature-only dataset to: {OUT_FILE}")
    print(
        "Source: "
        f"{SOURCE_WORKBOOK.name} / {SOURCE_SHEET} / "
        f"{SOURCE_TIMESTAMP_COLUMN} + {SOURCE_TEMPERATURE_COLUMN}"
    )
    print(f"Sampling frequency: {SOURCE_SAMPLING_FREQUENCY}")
    print(f"365-row repetition audit: {repetition_audit}")
    print(f"Rows: {len(combined)}")
    print(f"Min temp: {combined['temperature'].min()} | Max temp: {combined['temperature'].max()}")


if __name__ == '__main__':
    main()
