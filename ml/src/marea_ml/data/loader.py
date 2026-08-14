"""Data loading and basic validation.

This module handles CSV import, timestamp parsing, and chronological verification.
It also supports the MAREA research Excel files where temperature is embedded among
other variables and must be sanitized before training.
"""

from pathlib import Path
from typing import Optional, Sequence
import pandas as pd


def _normalize_temperature_value(value):
    """Convert common Excel and research-data values into a numeric float."""
    if pd.isna(value):
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        cleaned = cleaned.replace('°', '').replace('C', '').replace('c', '').strip()
        cleaned = cleaned.replace(',', '.')
        try:
            return float(cleaned)
        except ValueError:
            return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _find_temperature_column(columns: Sequence[str]) -> Optional[str]:
    """Find the temperature column in a dataset, including common aliases."""
    normalized = [str(col).strip().lower() for col in columns]
    aliases = [
        'temperature',
        'temp',
        't (°c)',
        't',
        'temp_c',
        'temperature_c',
        'water temperature',
        'water_temp',
        'sea temperature',
        'sea_temp',
    ]
    for alias in aliases:
        for idx, col in enumerate(normalized):
            if col == alias or alias in col:
                return columns[idx]
    for idx, col in enumerate(columns):
        name = str(col).lower()
        if 'temp' in name and 'date' not in name and 'depth' not in name:
            return col
    return None


def _find_timestamp_column(columns: Sequence[str]) -> Optional[str]:
    """Find the date/time column in a dataset."""
    normalized = [str(col).strip().lower() for col in columns]
    for alias in ['date', 'timestamp', 'time', 'datetime', 'date_time']:
        for idx, col in enumerate(normalized):
            if col == alias or alias in col:
                return columns[idx]
    for idx, col in enumerate(columns):
        name = str(col).lower()
        if 'date' in name or 'time' in name:
            return col
    return None


def load_temperature_excel(
    filepath: Path or str,
    timestamp_col: str = "timestamp",
    temperature_col: str = "temperature",
    preferred_sheet: Optional[str] = None,
) -> pd.DataFrame:
    """Load a raw Excel workbook and keep only the timestamp + temperature columns.

    This is used for the MAREA researcher dataset, where temperature is only one of
    several physical and chemical measurements. We sanitize and retain only the
    temperature values needed for forecasting.
    """
    filepath = Path(filepath)
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")

    excel = pd.ExcelFile(filepath)
    sheet_names = excel.sheet_names
    sheet_name = preferred_sheet if preferred_sheet in sheet_names else sheet_names[0]

    df = pd.read_excel(filepath, sheet_name=sheet_name)
    ts_col = _find_timestamp_column(df.columns)
    temp_col = _find_temperature_column(df.columns)

    if ts_col is None:
        raise ValueError(f"No date/time column found in {filepath}. Available columns: {list(df.columns)}")
    if temp_col is None:
        raise ValueError(f"No temperature column found in {filepath}. Available columns: {list(df.columns)}")

    out = pd.DataFrame({
        timestamp_col: pd.to_datetime(df[ts_col], errors='coerce'),
        temperature_col: df[temp_col].map(_normalize_temperature_value),
    }).dropna(subset=[timestamp_col, temperature_col]).sort_values(timestamp_col).reset_index(drop=True)

    if out.empty:
        raise ValueError(f"No valid temperature rows were found in {filepath}")

    return out


def load_temperature_csv(
    filepath: Path or str,
    timestamp_col: str = "timestamp",
    temperature_col: str = "temperature",
    parse_dates: bool = True
) -> pd.DataFrame:
    """
    Load a CSV file containing sea-temperature measurements.
    
    Args:
        filepath: Path to CSV file
        timestamp_col: Name of timestamp column
        temperature_col: Name of temperature column
        parse_dates: Whether to parse timestamp column as datetime
    
    Returns:
        DataFrame with parsed timestamps and temperatures
        
    Raises:
        FileNotFoundError: If file does not exist
        ValueError: If required columns not found
    """
    filepath = Path(filepath)
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    
    df = pd.read_csv(filepath)
    
    if timestamp_col not in df.columns:
        raise ValueError(f"Timestamp column '{timestamp_col}' not found. Available: {df.columns.tolist()}")
    if temperature_col not in df.columns:
        raise ValueError(f"Temperature column '{temperature_col}' not found. Available: {df.columns.tolist()}")
    
    if parse_dates:
        df[timestamp_col] = pd.to_datetime(df[timestamp_col])
    
    return df.sort_values(timestamp_col).reset_index(drop=True)


def verify_chronological_order(
    df: pd.DataFrame,
    timestamp_col: str = "timestamp"
) -> bool:
    """
    Verify that timestamps are in strictly increasing order.
    
    Args:
        df: DataFrame to check
        timestamp_col: Name of timestamp column
        
    Returns:
        True if timestamps are ordered, False otherwise
    """
    if timestamp_col not in df.columns:
        raise ValueError(f"Column '{timestamp_col}' not found")
    
    timestamps = df[timestamp_col]
    return (timestamps.diff().dropna() > pd.Timedelta(0)).all()
