#!/usr/bin/env python
"""Prepare the researcher temperature dataset for ML training.

This script extracts the real research Excel files, sanitizes the temperature values,
and stores a clean temperature-only dataset for training and prediction.
"""

import sys
from pathlib import Path
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from marea_ml.data.loader import load_temperature_excel


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RAW_DIR = DATA_DIR / "raw" / "Data_modele_to_Bassiana" / "Data_modele_to_Bassiana"
OUT_FILE = DATA_DIR / "processed" / "temperature_series.csv"


def main() -> None:
    excel_candidates = sorted(RAW_DIR.glob('*.xlsx')) + sorted(RAW_DIR.glob('*.xls'))
    if not excel_candidates:
        raise FileNotFoundError(f'No Excel data found under: {RAW_DIR}')

    frames = []
    for excel_path in excel_candidates:
        if excel_path.name.lower().endswith(('.xls', '.xlsx')):
            try:
                df = load_temperature_excel(excel_path)
                frames.append(df)
                print(f"Loaded {len(df)} rows from {excel_path.name}")
            except Exception as exc:
                print(f"Skipped {excel_path.name}: {type(exc).__name__}: {exc}")

    if not frames:
        raise ValueError(f'No valid temperature data could be extracted from {RAW_DIR}')

    combined = pd.concat(frames, ignore_index=True)
    combined = combined.drop_duplicates(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
    combined['temperature'] = pd.to_numeric(combined['temperature'], errors='coerce')
    combined = combined.dropna(subset=['temperature']).reset_index(drop=True)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    combined.to_csv(OUT_FILE, index=False)
    print(f"Saved temperature-only dataset to: {OUT_FILE}")
    print(f"Rows: {len(combined)}")
    print(f"Min temp: {combined['temperature'].min()} | Max temp: {combined['temperature'].max()}")


if __name__ == '__main__':
    main()
