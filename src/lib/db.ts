import { v4 as uuidv4 } from 'uuid';
import { Reading, Threshold, Alert, SensorType } from '../types/marea';

const READINGS_KEY = 'marea_readings';
const THRESHOLDS_KEY = 'marea_thresholds';
const ALERTS_KEY = 'marea_alerts';

const LEGACY_READINGS_KEY = 'nawras_readings';
const LEGACY_THRESHOLDS_KEY = 'nawras_thresholds';
const LEGACY_ALERTS_KEY = 'nawras_alerts';

const DATA_UPDATE_EVENT = 'marea-data-updated';

const defaultThresholds: Threshold[] = [
  { id: uuidv4(), sensor_type: 'temperature', min_value: 10, max_value: 30, updated_at: new Date().toISOString() },
  { id: uuidv4(), sensor_type: 'ph', min_value: 6.5, max_value: 8.5, updated_at: new Date().toISOString() },
  { id: uuidv4(), sensor_type: 'salinity', min_value: 35, max_value: 40, updated_at: new Date().toISOString() },
  { id: uuidv4(), sensor_type: 'turbidity', min_value: 0, max_value: 5, updated_at: new Date().toISOString() },
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
          message: `${getSensorLabel(reading.sensor_type)} anormalement bas : ${reading.value.toFixed(2)} ${reading.unit} (min attendu ${threshold.min_value})`,
          acknowledged: false,
        });
      } else if (reading.value > threshold.max_value) {
        newAlerts.push({
          reading_id: reading.id,
          sensor_type: reading.sensor_type,
          message: `${getSensorLabel(reading.sensor_type)} anormalement haut : ${reading.value.toFixed(2)} ${reading.unit} (max attendu ${threshold.max_value})`,
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
    temperature: 'Température',
    ph: 'pH',
    salinity: 'Salinité',
    turbidity: 'Turbidité',
  };
  return labels[type];
}

export function getSensorUnit(type: SensorType): string {
  const units: Record<SensorType, string> = {
    temperature: '°C',
    ph: '',
    salinity: 'PSU',
    turbidity: 'NTU',
  };
  return units[type];
}
