-- =====================================================
-- MAREA TIME-SERIES DATABASE SCHEMA (TimescaleDB / PostgreSQL)
-- Marine Aquaculture Risk & Early-warning Analytics
-- =====================================================

-- Enable TimescaleDB extension if available
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- 1. TELEMETRY READINGS TABLE (17-Field IoT Contract)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS telemetry_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    node_name VARCHAR(64) NOT NULL,
    seq BIGINT NOT NULL,
    
    -- Temperature (DS18B20)
    temp_ok BOOLEAN NOT NULL DEFAULT TRUE,
    temp DOUBLE PRECISION NOT NULL,
    
    -- IMU Wave & Dynamic Motion (MPU6050)
    mpu_ok BOOLEAN NOT NULL DEFAULT TRUE,
    ax DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ay DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    az DOUBLE PRECISION NOT NULL DEFAULT 9.81,
    gx DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    gy DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    gz DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    
    -- GPS Geolocation (NEO-6M)
    gps_ok BOOLEAN NOT NULL DEFAULT FALSE,
    lat DOUBLE PRECISION NOT NULL DEFAULT 37.2745,
    lon DOUBLE PRECISION NOT NULL DEFAULT 9.8732,
    sats INTEGER NOT NULL DEFAULT 0,
    alt DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    hdop DOUBLE PRECISION NOT NULL DEFAULT 99.9,
    
    -- RF Link Quality
    rssi INTEGER NOT NULL DEFAULT -70,
    snr DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on time and node for ultra-fast range queries
CREATE INDEX IF NOT EXISTS idx_telemetry_time_node ON telemetry_readings (node_name, time DESC);

-- Convert to Hypertable in TimescaleDB (if supported)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('telemetry_readings', 'time', if_not_exists => TRUE);
    END IF;
END $$;

-- -----------------------------------------------------
-- 2. HOURLY TELEMETRY AGGREGATES
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS telemetry_hourly_aggregates (
    bucket TIMESTAMPTZ NOT NULL,
    node_name VARCHAR(64) NOT NULL,
    reading_count INTEGER NOT NULL,
    avg_temp DOUBLE PRECISION,
    min_temp DOUBLE PRECISION,
    max_temp DOUBLE PRECISION,
    avg_wave_accel DOUBLE PRECISION,
    avg_rssi DOUBLE PRECISION,
    PRIMARY KEY (bucket, node_name)
);

-- -----------------------------------------------------
-- 3. AI FORECAST PREDICTIONS TABLE
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS forecast_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_for TIMESTAMPTZ NOT NULL,
    horizon_days INTEGER NOT NULL,
    predicted_temp DOUBLE PRECISION NOT NULL,
    confidence_lower DOUBLE PRECISION NOT NULL,
    confidence_upper DOUBLE PRECISION NOT NULL,
    model_name VARCHAR(64) NOT NULL DEFAULT 'MAREA-Hybrid-LSTM',
    model_version VARCHAR(32) NOT NULL DEFAULT 'v1.2',
    reference_baseline_temp DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_time ON forecast_records (forecast_for DESC);

-- -----------------------------------------------------
-- 4. SENSOR THRESHOLDS & HEALTH ALERTS
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS threshold_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    node_name VARCHAR(64) NOT NULL,
    sensor_type VARCHAR(32) NOT NULL,
    reading_value DOUBLE PRECISION NOT NULL,
    threshold_min DOUBLE PRECISION,
    threshold_max DOUBLE PRECISION,
    severity VARCHAR(16) NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
    message TEXT NOT NULL,
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON threshold_alerts (acknowledged, time DESC);

-- -----------------------------------------------------
-- 5. INITIAL SEED THRESHOLDS
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_thresholds (
    sensor_type VARCHAR(32) PRIMARY KEY,
    min_value DOUBLE PRECISION NOT NULL,
    max_value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(16) NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO sensor_thresholds (sensor_type, min_value, max_value, unit, description)
VALUES 
    ('temperature', 14.0, 28.5, '°C', 'Seabass & Seabream normal thermal physiological range'),
    ('rate_of_change', -1.5, 1.5, '°C/hr', 'Maximum safe water temperature gradient per hour'),
    ('rssi', -115, -30, 'dBm', 'LoRa RF link budget operational limits'),
    ('wave_accel', 0.0, 4.5, 'm/s²', 'Rough sea & cage stress mechanical limit')
ON CONFLICT (sensor_type) DO NOTHING;
