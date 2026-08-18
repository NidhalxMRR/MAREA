# Project MAREA: Marine Aquaculture Risk & Early-warning Analytics live demo : http://161.97.134.3:8080/

[![CI/CD Pipeline](https://github.com/NidhalxMRR/MAREA/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/NidhalxMRR/MAREA/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestrated-326CE5?logo=kubernetes&logoColor=white)](k8s/)

> **"Predict the water. Protect the harvest."**  
> An end-to-end environmental intelligence platform for coastal lagoons (Bizerte Lagoon, Tunisia) that ingests 17-field IoT buoy telemetry over LoRa/WiFi, stores high-frequency time-series in TimescaleDB, executes AI forecasting models, and serves an interactive research and operations dashboard.

---

## System Architecture

```
+-------------------------------------------------------------------------------+
|                             IoT DATA INGESTION                                |
|  [TX Node (Buoy Sensors)]  --LoRa 868.8MHz-->  [RX Gateway (TTGO LoRa32)]     |
|   - DS18B20 Temp                                 - LoRa packet parsing         |
|   - MPU6050 Accel/Gyro                           - WiFi HTTP POST JSON         |
|   - GPS NEO-6M                                   - Fallback Simulator          |
+---------------------------------------+---------------------------------------+
                                        | (HTTP POST /api/telemetry)
                                        v
+-------------------------------------------------------------------------------+
|                          MAREA BACKEND & TIME-SERIES                          |
|  +---------------------------------+  +------------------------------------+  |
|  |     MAREA API Ingestion Engine  |  |    TimescaleDB / PostgreSQL        |  |
|  |  - Express / FastAPI REST API   |  |  - 17-field Telemetry Hypertables  |  |
|  |  - Validation & Sanity Bounds   |  |  - Continuous Aggregates (1h, 1d)  |  |
|  |  - Alerting & Anomaly Engine    |  |  - Anomaly & Rate-of-change cache  |  |
|  +---------------------------------+  +------------------------------------+  |
+---------------------------------------+---------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
+---------------------------------+           +---------------------------------+
|      AI FORECASTING ENGINE      |           |     REACT + VITE DASHBOARD      |
|  - ARIMA / Seasonal Baselines   |           |  - Overview & Current Condition |
|  - LSTM PyTorch Deep Learning   |  <=====>  |  - Live Wave & IMU Dynamics     |
|  - Rate-of-Change & Risk Engine |           |  - Forecast Horizon Projection  |
|  - Gemini AI Studio Connector   |           |  - Alerts & Data Provenance     |
+---------------------------------+           +---------------------------------+
```

---

## Key Features

1. **17-Field IoT Telemetry Contract:** Real-time water temperature (DS18B20), 6-DOF IMU wave dynamics (MPU6050), GPS position & satellite fix (NEO-6M), and RF link quality (RSSI/SNR).
2. **High-Performance Time-Series Database:** TimescaleDB / PostgreSQL with hypertables, hourly rollups, and indexing for sub-millisecond range queries.
3. **AI Forecasting & Rate-of-Change Engine:** Multi-horizon predictive models (1-day, 3-day, 7-day, 14-day) with confidence bounds and anomaly alerting.
4. **Google AI Studio Integration:** Complete blueprint in [`docs/GOOGLE_AI_STUDIO_ADVISORY.md`](docs/GOOGLE_AI_STUDIO_ADVISORY.md) for Gemini 1.5/2.0 multimodal satellite SST and structured environmental risk reasoning.
5. **Multi-Platform Deployment:** 1-click Docker Compose, Kubernetes manifests (`k8s/`), and automated GitHub Actions CI/CD pipeline with remote VPS deployment.

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+ & npm
- Python 3.11+
- Docker & Docker Compose (optional for containerized run)

### 2. Run with Docker Compose (Recommended)
Launch the entire stack (Database, Backend API, Frontend UI, and Buoy Simulator) with one command:

```bash
# Clone the repository
git clone https://github.com/NidhalxMRR/MAREA.git
cd MAREA

# Build and start all services
docker compose up --build -d
```

Access the services:
- **Web Dashboard:** [http://localhost:8080](http://localhost:8080)
- **Backend API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Live Forecasts:** [http://localhost:5000/api/forecast](http://localhost:5000/api/forecast)
- **PostgreSQL / TimescaleDB:** `localhost:5432` (`user: marea`, `pass: marea_secret_2026`, `db: marea_db`)

---

### 3. Run Manually (Local Dev Mode)

#### Frontend:
```bash
npm install
npm run dev
# Dashboard opens on http://localhost:3000
```

#### Backend API:
```bash
cd server
npm install
npm run dev
# Server starts on http://localhost:5000
```

#### Run Telemetry Simulator:
```bash
python scripts/simulate_rx.py --url http://localhost:5000/api/telemetry --interval 3.0
```

#### Run Python ML Unit Tests:
```bash
.venv/Scripts/python.exe -m pytest ml/tests/ -q
```

---

## Deployment Guide

### A. Deploy to Testing VPS (`161.97.134.3`)
The automated deployment script handles environment configuration, container builds, database schema initialization, and health checks:

```bash
ssh nidhal@161.97.134.3
git clone https://github.com/NidhalxMRR/MAREA.git ~/MAREA || cd ~/MAREA && git pull
cd ~/MAREA
bash scripts/deploy.sh
```

### B. Production Facility Deployment (Kubernetes)
Deploy Project MAREA to any Kubernetes cluster (k3s, microk8s, EKS, GKE):

```bash
# Apply all Kubernetes manifests via Kustomize
kubectl apply -k k8s/

# Verify running pods
kubectl get pods -n marea
```

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/telemetry` | Ingest 17-field JSON payload from IoT RX gateway |
| `GET` | `/api/telemetry/latest` | Retrieve latest buoy observation and status |
| `GET` | `/api/telemetry/history` | Query time-series telemetry (`?limit=100&node=...`) |
| `GET` | `/api/forecast` | Retrieve multi-horizon AI temperature projections |
| `GET` | `/api/alerts` | Query active threshold and system alerts |
| `GET` | `/api/health` | Service liveness and readiness probe |

---

## IoT Firmware Configuration (TTGO LoRa32 RX)

1. Open [`IoT sensor/Rx.ino`](IoT%20sensor/Rx.ino) in Arduino IDE or PlatformIO.
2. Set your local WiFi credentials:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_NAME";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* BACKEND_URL   = "http://161.97.134.3:5000/api/telemetry";
   ```
3. Flash the sketch to your TTGO LoRa32 V1.3 receiver. Once connected to WiFi, incoming LoRa packets will be forwarded automatically as JSON to the MAREA database.

---

## Documentation & Research Resources

- **Google AI Studio Advisory & Forecasting Blueprint:** [`docs/GOOGLE_AI_STUDIO_ADVISORY.md`](docs/GOOGLE_AI_STUDIO_ADVISORY.md)
- **ML & Full-Stack Progress Report:** [`ml/AGENT_HANDOFF_PROGRESS.md`](ml/AGENT_HANDOFF_PROGRESS.md)
- **Database Schema:** [`server/db/schema.sql`](server/db/schema.sql)
- **Kubernetes Manifests:** [`k8s/`](k8s/)

---

## License

This project is open-source under the MIT License for marine environmental research and aquaculture preservation.
