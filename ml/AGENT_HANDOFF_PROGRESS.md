# MAREA ML Agent Handoff Progress

Last updated: 2026-08-15
Scope: ML module only (`ml/`) with strict requirement to keep frontend unchanged.

## 1) Mission and Constraints Received

- Build a professional ML/Data/AI structure for sea-water temperature forecasting.
- Keep the existing React frontend intact (no reorganization/breakage).
- Use real researcher data (no fabricated dataset, no fake training).
- Focus only on temperature for now (other variables deferred).
- Enforce chronological time-series methodology and no leakage.
- Sanitize training data and verify by running scripts/tests.

## 2) High-Level Outcome

- Real dataset was located, extracted, parsed, and sanitized.
- Temperature-only processed dataset was generated and validated.
- Baseline training runs end-to-end on the real temperature series.
- Targeted loader/sanitization tests pass.
- Core architecture for extension (future multi-variable work) is in place.

## 3) Data Discovery and Extraction

Archive located:
- `C:/Users/xfive/Downloads/Data_modele_to_Bassiana.rar`

Extraction location:
- `ml/data/raw/Data_modele_to_Bassiana/Data_modele_to_Bassiana/`

Relevant extracted workbook used for temperature pipeline:
- `ml/data/raw/Data_modele_to_Bassiana/Data_modele_to_Bassiana/Wat_physico_chemical_range.xlsx`

Other extracted files present:
- `ml/data/raw/Data_modele_to_Bassiana/Data_modele_to_Bassiana/Wat_chemical_range.xlsx`
- `ml/data/raw/Data_modele_to_Bassiana/Data_modele_to_Bassiana/Wat_phytoplankton_range.xlsx`
- `ml/data/raw/Data_modele_to_Bassiana/Data_modele_to_Bassiana/Wat_zooplankton_range.xlsx`
- `ml/data/raw/Data_modele_to_Bassiana/Data_modele_to_Bassiana/databassianaBio.xls`
- `ml/data/raw/Data_modele_to_Bassiana/Data_modele_to_Bassiana/databassianaDyn.xls`

## 4) Temperature Sanitization and Ingestion

Main ingestion logic:
- `ml/src/marea_ml/data/loader.py`

Key behavior implemented:
- Detect timestamp column aliases (`Date`, `timestamp`, etc.).
- Detect temperature column aliases including `T (°C)` and `Temperature`.
- Normalize malformed numeric values (empty strings, symbols, commas/decimals, NA-like content).
- Drop invalid rows and sort chronologically.
- Return canonical columns:
  - `timestamp`
  - `temperature`

Processed dataset generated:
- `ml/data/processed/temperature_series.csv`

Verified processed dataset stats:
- Rows: 3640
- Columns: `timestamp`, `temperature`
- Temperature min: 11.70528
- Temperature max: 31.3013

### Confirmed provenance correction (2026-08-15)

The processed temperature series was traced directly to one raw source:

- Workbook: `Wat_physico_chemical_range.xlsx`
- Worksheet: `Physico_Chemical`
- Timestamp column: `Date`
- Temperature column: `T (°C)`
- Rows: 3,640 (`2004-01-01` through `2013-12-18`)
- Sampling frequency: daily (all 3,639 adjacent timestamp intervals are one day)

`temperature_series.csv` matches the raw `Date` + `T (°C)` rows exactly,
including timestamps and values. The source values repeat exactly at a 365-row
lag: 3,275 of 3,275 comparable pairs match. This fixed 365-sample cycle is
already present in the researcher workbook; it was not introduced by the
extraction script. Leap days remain in the timestamps, so the repeated sequence
is not aligned to the same calendar date each year.

The pipeline now pins this workbook, sheet, and columns instead of scanning all
Excel files. The source-specific provenance configuration marks this dataset as
approved for researcher-authorized model development, but **not approved for
operational forecasting validation on its own**. The exact 365-row pattern means
ordinary chronological scores are not independent-year generalization evidence;
validated live IoT site measurements are needed for that purpose.

The researcher described approximately 20 years of history, while the supplied
extract covers `2004-01-01` through `2013-12-18` (approximately 10 years). If
additional files become available, ingest them as separate immutable raw sources
and repeat the same provenance checks before combining or evaluating them.

The repetition remains a documented observation, not a reclassification of the
values as synthetic, modelled, measured, or climatological.

Original provenance question retained for future clarification:

> In Wat_physico_chemical_range.xlsx, sheet Physico_Chemical, T (°C) repeats
> exactly every 365 daily records from 2004 onward. Are these measured historical
> observations, generated/modelled reference values, climatological values, or
> intentionally repeated simulation data?

## 5) Training and Evaluation Status

Baseline script:
- `ml/scripts/train_baseline.py`

Run performed against real processed data:
- Input: `ml/data/processed/temperature_series.csv`
- Output report: `ml/reports/baseline_results_temperature_real.json`

Latest baseline metrics (PersistenceBaseline):
- `n_samples`: 727
- `mae`: 0.15156348005502068
- `rmse`: 0.2034494371255731
- `r2`: 0.998961869380574
- `threshold_event_recall`: 0.9886363636363636
- `false_alert_rate`: 0.011363636363636364

### Daily reference-baseline phase (2026-08-15)

The supplied source supports daily—not 15-minute—evaluation. The generic
15-minute configuration remains reserved for the future validated IoT pipeline.
For this researcher profile, evaluate only the configurable daily horizons of 1,
3, and 7 days with persistence and 365-day seasonal persistence.

Report MAE/RMSE for temperature and temperature change, plus descriptive
upper-temperature quantile groups. These groups are analytical rankings, not
aquaculture danger limits: no biological risk threshold is set or inferred.
Because every valid 365-row comparison is exact, the seasonal-persistence
baseline is expected to have zero MAE/RMSE wherever that lag is available. That
is a scientific result about the supplied deterministic annual structure, not a
reason to train a feature model or LSTM that merely reproduces it.

Production direction: the researcher series is the expected seasonal reference;
validated live IoT readings will supply actual site behavior, deviation
monitoring, independent validation, and future versioned retraining data. Raw
IoT data must be immutable and validated before it is promoted for inference or
retraining.

## 6) Tests Added and Verification

Targeted tests for real-data loader behavior:
- `ml/tests/test_real_temperature_data.py`

Purpose:
- Validate Excel loading from real-world style temperature sheets.
- Ensure temperature-only extraction and alias handling.

Import-path bootstrap for src-layout tests:
- `ml/tests/conftest.py`

Latest test status:
- `2 passed` for `tests/test_real_temperature_data.py`

## 7) Critical Fixes Applied During Work

1. Config path bug fixed:
- File: `ml/src/marea_ml/config.py`
- Issue: configuration resolver pointed outside `ml/`.
- Fix: config directory now resolves to `ml/configs` correctly.

2. Dependency alignment for Excel workflows:
- Files:
  - `ml/requirements.txt`
  - `ml/pyproject.toml`
- Added dependencies:
  - `openpyxl`
  - `xlrd`

3. Pytest import resolution:
- File: `ml/tests/conftest.py`
- Added `src` injection into `sys.path` for package discovery during tests.

## 8) Environment Notes

Configured Python environment:
- Workspace venv: `C:/Users/xfive/Desktop/Project MAREA/.venv/`
- Interpreter used successfully:
  - `C:/Users/xfive/Desktop/Project MAREA/.venv/Scripts/python.exe`

Important:
- Running scripts/tests with a different Python interpreter may fail due to missing deps.
- Prefer the project venv interpreter above.

## 9) Frontend Safety

Frontend app was intentionally preserved and not reorganized.
No ML change requires React code movement.

## 10) What Is Done vs Pending

Done:
- Real archive discovery and extraction.
- Temperature column identification and sanitization.
- Processed temperature series generation.
- Baseline training execution on real data.
- Targeted test verification passing.
- Config/dependency/import fixes for reproducible runs.

Pending (next agent):
- Expand test coverage beyond targeted loader tests (pipeline-level regression tests).
- Add stricter data quality audits (gap analysis, duplicate timestamp policy by config).
- Implement additional baselines/features while keeping chronology and leakage rules.
- Keep extension to non-temperature variables deferred until explicitly requested.

## 11) Quick Continuation Commands

From repository root (`Project MAREA`):

1) Run targeted loader tests:
- `cd ml`
- `../.venv/Scripts/python.exe -m pytest tests/test_real_temperature_data.py -q --override-ini addopts=''`

2) Train baseline on current processed series:
- `cd ml`
- `../.venv/Scripts/python.exe scripts/train_baseline.py --input data/processed/temperature_series.csv --output reports/baseline_results_temperature_real.json`

3) Inspect output report:
- `ml/reports/baseline_results_temperature_real.json`

## 12) Non-Negotiable Rules for Continuation

- Keep chronological splits only (no random shuffle for time-series).
- No data leakage in preprocess/scale/feature computations.
- Fit transformers/statistics on train set only.
- Use only real data, no fabricated dataset artifacts.
- Keep focus on temperature-only pipeline until user requests expansion.
