#!/usr/bin/env python
"""Audit raw sea-temperature data.

This script programmatically runs data validation and generates a report.
Used for reproducible data quality checks across different datasets.

Usage:
  python scripts/audit_data.py --input data/raw/bizerte.csv --output reports/audit.json
"""

import sys
from pathlib import Path

# Add src to path for import
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from marea_ml.data.loader import load_temperature_csv, verify_chronological_order
from marea_ml.data.validation import generate_validation_report
from marea_ml.config import Config
import json
import argparse


def main():
    """Run data audit."""
    parser = argparse.ArgumentParser(description="Audit raw temperature dataset")
    parser.add_argument("--input", type=str, required=True, help="Input CSV or Excel file")
    parser.add_argument("--output", type=str, default="reports/audit_report.json", help="Output JSON report")
    
    args = parser.parse_args()
    
    # Load configuration
    config = Config.load("data")
    timestamp_col = config.get("timestamp_column", "timestamp")
    temperature_col = config.get("temperature_column", "temperature")
    
    print(f"Loading data from: {args.input}")
    input_path = Path(args.input)
    if input_path.suffix.lower() in {'.xlsx', '.xls'}:
        from marea_ml.data.loader import load_temperature_excel
        df = load_temperature_excel(input_path)
    else:
        df = load_temperature_csv(args.input, timestamp_col=timestamp_col, temperature_col=temperature_col)
    print(f"Loaded {len(df)} records")
    
    # Verify chronological order
    is_ordered = verify_chronological_order(df, timestamp_col)
    print(f"Chronological order: {'✓' if is_ordered else '✗'}")
    
    # Generate report
    report = generate_validation_report(df, timestamp_col=timestamp_col, temperature_col=temperature_col)
    report["filename"] = args.input
    report["chronologically_ordered"] = is_ordered
    
    # Save report
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"Report saved to: {output_path}")
    print("\nValidation Summary:")
    print(f"  Total rows: {report['total_rows']}")
    print(f"  Duplicate timestamps: {report['duplicated_timestamps']['count']}")
    print(f"  Missing timestamps: {report['missing_timestamps']['gap_count']}")
    print(f"  Invalid temperatures: {report['invalid_temperatures']['count']}")


if __name__ == "__main__":
    main()
