#!/usr/bin/env python
"""Train LSTM model for temperature forecasting.

Usage:
  python scripts/train_lstm.py --input data/processed/train.csv --model_output models/lstm_v001.keras
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import argparse


def main():
    """Train LSTM model."""
    parser = argparse.ArgumentParser(description="Train LSTM temperature forecasting model")
    parser.add_argument("--input", type=str, required=True, help="Input CSV file")
    parser.add_argument("--model_output", type=str, default="models/lstm_v001.keras", help="Model output path")
    
    args = parser.parse_args()
    
    print("LSTM training script placeholder.")
    print("Full LSTM training will be implemented in notebooks/05_lstm.ipynb")
    print(f"Input: {args.input}")
    print(f"Output: {args.model_output}")
    print("\nNote: Requires TensorFlow/Keras in requirements.txt")


if __name__ == "__main__":
    main()
