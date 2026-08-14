#!/usr/bin/env python
"""Evaluate and compare all trained models.

Usage:
  python scripts/evaluate_model.py --test_data data/processed/test.csv --models_dir models/
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import argparse


def main():
    """Evaluate models."""
    parser = argparse.ArgumentParser(description="Evaluate and compare all models")
    parser.add_argument("--test_data", type=str, required=True, help="Test dataset")
    parser.add_argument("--models_dir", type=str, default="models/", help="Directory with model files")
    
    args = parser.parse_args()
    
    print("Model evaluation script placeholder.")
    print("Full comparison will be implemented in notebooks/06_evaluation.ipynb")
    print(f"Test data: {args.test_data}")
    print(f"Models: {args.models_dir}")


if __name__ == "__main__":
    main()
