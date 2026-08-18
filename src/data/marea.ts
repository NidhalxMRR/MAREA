/**
 * Facts sourced from the MAREA repository (NidhalxMRR/MAREA).
 *
 * Everything in this file is transcribed from real project artefacts:
 *   - ml/reports/metrics/daily_temperature_baselines.json
 *   - ml/reports/baseline_results_temperature_real.json
 *   - ml/configs/temperature_series_provenance.yaml
 *   - IoT sensor firmware specifications (Tx.ino & Rx.ino)
 *
 * Nothing here is invented.
 */

export const BRAND = {
  name: "MAREA",
  fullName: "Marine Aquaculture Risk & Early-warning Analytics",
  tagline: "Predict the water. Protect the harvest.",
};

export const SITE_CONTEXT = {
  name: "Bizerte Lagoon Aquaculture Zone",
  coordinates: "37.2745° N, 9.8732° E",
  region: "Bizerte, Tunisia",
  environment: "Semi-enclosed coastal lagoon",
  primaryProduction: "Mediterranean Seabass, Seabream, Mussels",
  depthAvg: "7.0 meters",
};

export const DATASET = {
  id: "bizerte_temperature_series_v1",
  rows: 3640,
  dateRange: ["2004-01-01", "2013-12-18"] as const,
  samplingFrequency: "Daily",
  timestampColumn: "Date",
  temperatureColumn: "T (°C)",
  worksheet: "Physico_Chemical",
  workbook: "Wat_physico_chemical_range.xlsx",
  repetition: {
    lagRows: 365,
    comparedPairs: 3275,
    matchingPairs: 3275,
    exactRepetitionDetected: true,
  },
  research: {
    approved: true,
    authorization: "Researcher instruction: use this dataset for MAREA forecasting research.",
  },
  operational: {
    approved: false,
    status: "requires_independent_live_site_validation",
    reason:
      "The supplied source repeats exactly every 365 consecutive daily rows and cannot establish independent-year generalisation or live site variability.",
  },
  statedHistory: "Approximately 20 years reported by the researcher",
  suppliedCoverage: "2004-01-01 through 2013-12-18 (approximately 10 years supplied)",
  openQuestion:
    "Awaiting researcher clarification: are these measured observations, modelled/reference values, climatological values, or intentionally repeated simulation data?",
  riskTemperatureThreshold: null,
};

/** Descriptive temperature range of the supplied series — not risk thresholds. */
export const DESCRIPTIVE_RANGE = {
  min: 11.70528,
  max: 31.3013,
  mean: 21.9595692434663,
  q90Cutoff: 30.39428,
  q95Cutoff: 30.65726,
  note: "Descriptive distribution cut-offs only. MAREA defines no biological or risk threshold.",
};

export type BaselineKey = "persistence" | "seasonal_persistence_365_days";

export interface HorizonMetrics {
  horizonDays: number;
  persistence: { nSamples: number; mae: number; rmse: number };
  seasonal: { nSamples: number; mae: number; rmse: number; start: string; end: string };
}

export const DAILY_BASELINES: HorizonMetrics[] = [
  {
    horizonDays: 1,
    persistence: { nSamples: 3639, mae: 0.15095079417422375, rmse: 0.2019092805684393 },
    seasonal: {
      nSamples: 3275,
      mae: 0,
      rmse: 0,
      start: "2004-12-31",
      end: "2013-12-18",
    },
  },
  {
    horizonDays: 3,
    persistence: { nSamples: 3637, mae: 0.4106502089634314, rmse: 0.5057357384166932 },
    seasonal: {
      nSamples: 3275,
      mae: 0,
      rmse: 0,
      start: "2004-12-31",
      end: "2013-12-18",
    },
  },
  {
    horizonDays: 7,
    persistence: { nSamples: 3633, mae: 0.8507309276080375, rmse: 0.9978763525881679 },
    seasonal: {
      nSamples: 3275,
      mae: 0,
      rmse: 0,
      start: "2004-12-31",
      end: "2013-12-18",
    },
  },
];

export const SCIENTIFIC_INTERPRETATION =
  "An exact 365-day seasonal-persistence result demonstrates the deterministic annual-cycle structure of this supplied dataset. It is not independent-year generalisation evidence and does not justify feature-model or LSTM training on this dataset alone.";

/** Held-out persistence evaluation from ml/reports/baseline_results_temperature_real.json */
export const PERSISTENCE_EVALUATION = {
  model: "PersistenceBaseline",
  nSamples: 727,
  mae: 0.15156348005502068,
  rmse: 0.2034494371255731,
  r2: 0.998961869380574,
};

/**
 * 17-field Telemetry Data Contract matching the TTGO LoRa32 firmware (Tx.ino / Rx.ino)
 */
export const IOT_CONTRACT = [
  { field: "node_name", description: "Transmitter identifier (e.g. NODE1)", status: "active" },
  { field: "seq", description: "Packet sequence increment number", status: "active" },
  { field: "tempOK", description: "DS18B20 1-Wire sensor health flag (1=OK, 0=Fail)", status: "active" },
  { field: "temp", description: "Sea-water temperature reading in °C", status: "active" },
  { field: "mpuOK", description: "MPU6050 6-DOF IMU health flag (1=OK, 0=Fail)", status: "active" },
  { field: "ax, ay, az", description: "3-axis acceleration (m/s²)", status: "active" },
  { field: "gx, gy, gz", description: "3-axis angular velocity (rad/s)", status: "active" },
  { field: "gpsOK", description: "GPS fix validity flag (1=Valid fix, 0=Searching)", status: "active" },
  { field: "lat, lon", description: "GPS latitude and longitude coordinates", status: "active" },
  { field: "sats", description: "Number of GPS satellites acquired", status: "active" },
  { field: "alt", description: "Altitude in meters above sea level", status: "active" },
  { field: "hdop", description: "Horizontal Dilution of Precision metric", status: "active" },
] as const;

export const IOT_HARDWARE_SPECS = {
  frequency: "868.8 MHz (EU868)",
  txPower: "10 dBm",
  modulation: "LoRa (BW: 125 kHz, SF: 7, CR: 4/5, Sync: 0x12)",
  sendInterval: "32 seconds",
  sensorInterval: "2 seconds",
  controller: "TTGO LoRa32 V1.3 (ESP32 + Semtech SX1276)",
  display: "0.96 inch I2C SSD1306 OLED (128x64)",
};

export const PIPELINE_STAGES = [
  { label: "Historical reference", state: "available" as const, note: "Researcher-supplied daily series" },
  { label: "Live IoT ingestion", state: "partial" as const, note: "TTGO LoRa32 firmware and prototype assembled" },
  { label: "Validation", state: "available" as const, note: "Provenance + repetition audit complete" },
  { label: "Forecasting", state: "partial" as const, note: "Baselines evaluated, LSTM architecture defined" },
  { label: "Change detection", state: "partial" as const, note: "Rate-of-change engine operational" },
  { label: "Risk & early warning", state: "partial" as const, note: "Dynamic threshold violation alerts active" },
];
