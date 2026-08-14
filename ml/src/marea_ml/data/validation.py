"""Data validation and quality checks.

This module detects data issues: duplicates, gaps, irregular sampling, invalid values.
"""

from typing import Dict, List, Tuple
import pandas as pd


def check_duplicated_timestamps(
    df: pd.DataFrame,
    timestamp_col: str = "timestamp"
) -> Tuple[bool, int]:
    """
    Check for duplicate timestamps.
    
    Args:
        df: DataFrame to check
        timestamp_col: Name of timestamp column
        
    Returns:
        Tuple of (has_duplicates, count)
    """
    if timestamp_col not in df.columns:
        raise ValueError(f"Column '{timestamp_col}' not found")
    
    duplicates = df[timestamp_col].duplicated().sum()
    return duplicates > 0, duplicates


def check_missing_timestamps(
    df: pd.DataFrame,
    timestamp_col: str = "timestamp",
    expected_interval_minutes: int = 15
) -> Tuple[bool, List[pd.Timestamp]]:
    """
    Detect gaps in timestamp sequence.
    
    Args:
        df: DataFrame to check
        timestamp_col: Name of timestamp column
        expected_interval_minutes: Expected interval between samples
        
    Returns:
        Tuple of (has_gaps, list_of_gap_locations)
    """
    if timestamp_col not in df.columns:
        raise ValueError(f"Column '{timestamp_col}' not found")
    
    df = df.sort_values(timestamp_col)
    time_diffs = df[timestamp_col].diff()
    expected_diff = pd.Timedelta(minutes=expected_interval_minutes)
    
    gaps = df[time_diffs > expected_diff][timestamp_col].tolist()
    return len(gaps) > 0, gaps


def check_missing_values(df: pd.DataFrame) -> Dict[str, int]:
    """
    Count missing values in all columns.
    
    Args:
        df: DataFrame to check
        
    Returns:
        Dictionary mapping column names to missing value counts
    """
    return df.isnull().sum().to_dict()


def check_invalid_temperatures(
    df: pd.DataFrame,
    temperature_col: str = "temperature",
    valid_range: Tuple[float, float] = (-5.0, 45.0)
) -> Tuple[bool, int]:
    """
    Detect temperatures outside valid range.
    
    Args:
        df: DataFrame to check
        temperature_col: Name of temperature column
        valid_range: (min, max) valid temperature bounds
        
    Returns:
        Tuple of (has_invalid, count)
    """
    if temperature_col not in df.columns:
        raise ValueError(f"Column '{temperature_col}' not found")
    
    invalid = ((df[temperature_col] < valid_range[0]) | 
               (df[temperature_col] > valid_range[1])).sum()
    return invalid > 0, invalid


def generate_validation_report(
    df: pd.DataFrame,
    timestamp_col: str = "timestamp",
    temperature_col: str = "temperature"
) -> Dict:
    """
    Generate comprehensive data quality report.
    
    Args:
        df: DataFrame to validate
        timestamp_col: Name of timestamp column
        temperature_col: Name of temperature column
        
    Returns:
        Dictionary containing validation results
    """
    has_dups, dup_count = check_duplicated_timestamps(df, timestamp_col)
    has_gaps, gap_list = check_missing_timestamps(df, timestamp_col)
    missing_vals = check_missing_values(df)
    has_invalid, invalid_count = check_invalid_temperatures(df, temperature_col)
    
    return {
        "total_rows": len(df),
        "duplicated_timestamps": {
            "found": has_dups,
            "count": dup_count
        },
        "missing_timestamps": {
            "found": has_gaps,
            "gap_count": len(gap_list)
        },
        "missing_values": missing_vals,
        "invalid_temperatures": {
            "found": has_invalid,
            "count": invalid_count
        }
    }
