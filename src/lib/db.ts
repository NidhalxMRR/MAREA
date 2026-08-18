import { v4 as uuidv4 } from 'uuid';
import { Reading, Threshold, Alert, SensorType } from '../types/marea';

const READINGS_KEY = 'marea_readings';
const THRESHOLDS_KEY = 'marea_thresholds';
const ALERTS_KEY = 'marea_alerts';

const LEGACY_READINGS_KEY = 'nawras_readings';
const LEGACY_THRESHOLDS_KEY = 'nawras_thresholds';
const LEGACY_ALERTS_KEY = 'nawras_alerts';

export const DATA_UPDATE_EVENT = 'marea-data-updated';

export const defaultThresholds: Threshold[] = [
  { id: uuidv4(), sensor_type: 'temperature', min_value: 14.0, max_value: 28.5, updated_at: new Date().toISOString() },
  { id: uuidv4(), sensor_type: 'ph', min_value: 6.8, max_value: 8.4, updated_at: new Date().toISOString() },
  { id: uuidv4(), sensor_type: 'salinity', min_value: 34.0, max_value: 39.5, updated_at: new Date().toISOString() },
  { id: uuidv4(), sensor_type: 'turbidity', min_value: 0.0, max_value: 4.5, updated_at: new Date().toISOString() },
];

function migrateLegacyStorageKeys() {
  if (typeof window === 'undefined') return;

  const migrations: Array<[string, string]> = [
    [READINGS_KEY, LEGACY_READINGS_KEY],
    [THRESHOLDS_KEY, LEGACY_THRESHOLDS_KEY],
    [ALERTS_KEY, LEGACY_ALERTS_KEY],
  ];

  migrations.forEach(([targetKey, legacyKey]) => {
    if (!localStorage.getItem(targetKey) && localStorage.getItem(legacyKey)) {
      localStorage.setItem(targetKey, localStorage.getItem(legacyKey) as string);
    }
    localStorage.removeItem(legacyKey);
  });
}

if (typeof window !== 'undefined') {
  migrateLegacyStorageKeys();
  if (!localStorage.getItem(THRESHOLDS_KEY)) {
    localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(defaultThresholds));
  }
}

export function getReadings(): Reading[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(READINGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function insertReadings(newReadings: Omit<Reading, 'id' | 'created_at'>[]): Reading[] {
  const readings = getReadings();
  const thresholds = getThresholds();

  const toInsert: Reading[] = newReadings.map(r => ({
    ...r,
    id: uuidv4(),
    created_at: new Date().toISOString(),
  }));

  const updatedReadings = [...readings, ...toInsert];
  localStorage.setItem(READINGS_KEY, JSON.stringify(updatedReadings));

  const newAlerts: Omit<Alert, 'id' | 'created_at'>[] = [];

  toInsert.forEach(reading => {
    const threshold = thresholds.find(t => t.sensor_type === reading.sensor_type);
    if (threshold) {
      if (reading.value < threshold.min_value) {
        newAlerts.push({
          reading_id: reading.id,
          sensor_type: reading.sensor_type,
          message: `${getSensorLabel(reading.sensor_type)} below threshold: ${reading.value.toFixed(2)} ${reading.unit} (Min normal: ${threshold.min_value})`,
          acknowledged: false,
        });
      } else if (reading.value > threshold.max_value) {
        newAlerts.push({
          reading_id: reading.id,
          sensor_type: reading.sensor_type,
          message: `${getSensorLabel(reading.sensor_type)} above threshold: ${reading.value.toFixed(2)} ${reading.unit} (Max normal: ${threshold.max_value})`,
          acknowledged: false,
        });
      }
    }
  });

  if (newAlerts.length > 0) {
    insertAlerts(newAlerts);
  }

  window.dispatchEvent(new Event(DATA_UPDATE_EVENT));
  return toInsert;
}

export function clearReadings() {
  localStorage.removeItem(READINGS_KEY);
  localStorage.removeItem(ALERTS_KEY);
  window.dispatchEvent(new Event(DATA_UPDATE_EVENT));
}

export function getThresholds(): Threshold[] {
  if (typeof window === 'undefined') return defaultThresholds;
  const data = localStorage.getItem(THRESHOLDS_KEY);
  return data ? JSON.parse(data) : defaultThresholds;
}

export function updateThreshold(sensor_type: SensorType, min_value: number, max_value: number) {
  let thresholds = getThresholds();
  const index = thresholds.findIndex(t => t.sensor_type === sensor_type);
  if (index !== -1) {
    thresholds[index] = { ...thresholds[index], min_value, max_value, updated_at: new Date().toISOString() };
  } else {
    thresholds.push({ id: uuidv4(), sensor_type, min_value, max_value, updated_at: new Date().toISOString() });
  }
  localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(thresholds));
  window.dispatchEvent(new Event(DATA_UPDATE_EVENT));
}

export function getAlerts(): Alert[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(ALERTS_KEY);
  return data ? JSON.parse(data) : [];
}

function insertAlerts(newAlerts: Omit<Alert, 'id' | 'created_at'>[]) {
  const alerts = getAlerts();
  const toInsert: Alert[] = newAlerts.map(a => ({
    ...a,
    id: uuidv4(),
    created_at: new Date().toISOString(),
  }));
  localStorage.setItem(ALERTS_KEY, JSON.stringify([...alerts, ...toInsert]));
}

export function acknowledgeAlert(alertId: string) {
  let alerts = getAlerts();
  alerts = alerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a);
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  window.dispatchEvent(new Event(DATA_UPDATE_EVENT));
}

export function getSensorLabel(type: SensorType): string {
  const labels: Record<SensorType, string> = {
    temperature: 'Water Temperature',
    ph: 'pH Level',
    salinity: 'Salinity',
    turbidity: 'Turbidity',
  };
  return labels[type];
}

export function getSensorUnit(type: SensorType): string {
  const units: Record<SensorType, string> = {
    temperature: '°C',
    ph: 'pH',
    salinity: 'PSU',
    turbidity: 'NTU',
  };
  return units[type];
}

export function getLatestReading(type?: SensorType): Reading | undefined {
  const readings = getReadings();
  if (readings.length === 0) return undefined;
  const filtered = type ? readings.filter(r => r.sensor_type === type) : readings;
  if (filtered.length === 0) return undefined;
  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
}

export function getSensorStats(type: SensorType) {
  const readings = getReadings().filter(r => r.sensor_type === type);
  if (readings.length === 0) {
    return { latest: undefined, avg: null, min: null, max: null, count: 0 };
  }
  const sorted = [...readings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const values = readings.map(r => r.value);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return {
    latest: sorted[0],
    avg,
    min,
    max,
    count: readings.length,
  };
}

export function getRateOfChange(type: SensorType = 'temperature') {
  const readings = getReadings()
    .filter(r => r.sensor_type === type)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (readings.length < 2) return null;

  const current = readings[readings.length - 1];
  const previous = readings[readings.length - 2];

  const timeDiffMs = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime();
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
  const delta = current.value - previous.value;
  const deltaPerHour = timeDiffHours > 0 ? delta / timeDiffHours : delta;

  return {
    delta,
    deltaPerHour,
    previousReading: previous,
    currentReading: current,
  };
}
