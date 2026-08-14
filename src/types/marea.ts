export type SensorType = 'temperature' | 'ph' | 'salinity' | 'turbidity';

export interface Reading {
  id: string;
  timestamp: string; // ISO 8601
  sensor_type: SensorType;
  value: number;
  unit: string;
  source: 'historical' | 'sonde';
  location_label?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface Threshold {
  id: string;
  sensor_type: SensorType;
  min_value: number;
  max_value: number;
  updated_at: string;
}

export interface Alert {
  id: string;
  reading_id: string;
  sensor_type: SensorType;
  message: string;
  created_at: string;
  acknowledged: boolean;
}
