import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL || 'postgres://marea:marea_secret_2026@localhost:5432/marea_db';

export const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5000,
  max: 20,
  idleTimeoutMillis: 30000,
});

export interface TelemetryPacket {
  id?: string;
  time?: string;
  node_name: string;
  seq: number;
  tempOK: boolean | number;
  temp: number;
  mpuOK: boolean | number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  gpsOK: boolean | number;
  lat: number;
  lon: number;
  sats: number;
  alt: number;
  hdop: number;
  rssi: number;
  snr: number;
}

// In-memory fallback buffer when PostgreSQL is starting up or in lightweight standalone test mode
const memoryTelemetry: TelemetryPacket[] = [];
let isDbConnected = false;

export async function initDatabase(): Promise<boolean> {
  try {
    const client = await pool.connect();
    console.log('[DB] Connected to PostgreSQL / TimescaleDB successfully.');
    
    // Read and run schema.sql if exists
    const schemaPath = path.resolve(__dirname, '../../db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('[DB] Schema initialized / verified successfully.');
    }
    client.release();
    isDbConnected = true;
    return true;
  } catch (err) {
    console.warn('[DB] PostgreSQL not directly available. Operating with high-speed in-memory buffer.', (err as Error).message);
    isDbConnected = false;
    return false;
  }
}

export async function insertTelemetry(packet: TelemetryPacket) {
  const timestamp = packet.time || new Date().toISOString();
  const id = uuidv4();

  const temp_ok = Boolean(packet.tempOK);
  const mpu_ok = Boolean(packet.mpuOK);
  const gps_ok = Boolean(packet.gpsOK);

  if (isDbConnected) {
    try {
      const query = `
        INSERT INTO telemetry_readings (
          id, time, node_name, seq, temp_ok, temp,
          mpu_ok, ax, ay, az, gx, gy, gz,
          gps_ok, lat, lon, sats, alt, hdop,
          rssi, snr
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19,
          $20, $21
        ) RETURNING *;
      `;
      const values = [
        id, timestamp, packet.node_name || 'MAREA_BUOY_01', packet.seq || 0,
        temp_ok, packet.temp,
        mpu_ok, packet.ax || 0, packet.ay || 0, packet.az || 9.81,
        packet.gx || 0, packet.gy || 0, packet.gz || 0,
        gps_ok, packet.lat || 37.2745, packet.lon || 9.8732,
        packet.sats || 0, packet.alt || 0, packet.hdop || 99.9,
        packet.rssi || -70, packet.snr || 8.0
      ];

      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      console.error('[DB] Insert error in Postgres, storing in fallback buffer:', err);
    }
  }

  // Fallback memory storage
  const record = { ...packet, id, time: timestamp };
  memoryTelemetry.push(record);
  if (memoryTelemetry.length > 5000) memoryTelemetry.shift();
  return record;
}

export async function getLatestTelemetry(nodeName?: string) {
  if (isDbConnected) {
    try {
      const query = nodeName
        ? 'SELECT * FROM telemetry_readings WHERE node_name = $1 ORDER BY time DESC LIMIT 1;'
        : 'SELECT * FROM telemetry_readings ORDER BY time DESC LIMIT 1;';
      const values = nodeName ? [nodeName] : [];
      const res = await pool.query(query, values);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.error('[DB] Error querying latest telemetry:', err);
    }
  }

  return memoryTelemetry.length > 0 ? memoryTelemetry[memoryTelemetry.length - 1] : null;
}

export async function getTelemetryHistory(limit = 100, nodeName?: string) {
  if (isDbConnected) {
    try {
      const query = nodeName
        ? 'SELECT * FROM telemetry_readings WHERE node_name = $1 ORDER BY time DESC LIMIT $2;'
        : 'SELECT * FROM telemetry_readings ORDER BY time DESC LIMIT $1;';
      const values = nodeName ? [nodeName, limit] : [limit];
      const res = await pool.query(query, values);
      return res.rows;
    } catch (err) {
      console.error('[DB] Error querying history:', err);
    }
  }

  return memoryTelemetry.slice(-limit).reverse();
}

export async function getActiveAlerts() {
  if (isDbConnected) {
    try {
      const res = await pool.query('SELECT * FROM threshold_alerts WHERE acknowledged = FALSE ORDER BY time DESC LIMIT 50;');
      return res.rows;
    } catch (err) {
      console.error('[DB] Error querying alerts:', err);
    }
  }
  return [];
}
