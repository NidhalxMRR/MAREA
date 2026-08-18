# MAREA ML & End-to-End System Agent Handoff Progress

**Last updated:** 2026-08-18  
**Scope:** Full-Stack MAREA System (IoT Ingestion, Time-Series Storage, ML/AI Forecasting, Frontend Dashboard, Docker/K8s Containerization, and VPS/Research Facility Deployment).

---

## 1) Mission and System Architecture

MAREA (*Marine Aquaculture Risk & Early-warning Analytics*) is an environmental intelligence system for coastal lagoons (Bizerte Lagoon, Tunisia) that:
1. Ingests 17-field live IoT buoy telemetry transmitted via LoRa (868.8 MHz) to an ESP32 WiFi gateway.
2. Persists telemetry in a dedicated Time-Series Database (TimescaleDB / PostgreSQL) with automated indexing, rollups, and rate-of-change metrics.
3. Computes real-time and multi-horizon AI forecasts (1-day, 3-day, 7-day, 14-day) combining historical climatological baselines with live site measurements.
4. Serves an operational React + Vite dashboard with interactive risk analytics, wave dynamics, rate of change, and threshold alerting.
5. Deploys via Docker Compose and Kubernetes (`k8s/`) across testing VPS (`161.97.134.3`) and the marine research facility.

---

## 2) System Components Status Matrix

| Component | Technology | Status | Key Deliverable |
| :--- | :--- | :--- | :--- |
| **IoT Node (TX)** | TTGO LoRa32 + DS18B20 + MPU6050 + GPS | Operational | 17-field packet broadcast on 868.8 MHz |
| **IoT Gateway (RX)** | TTGO LoRa32 + SSD1306 OLED + WiFi | Operational | LoRa packet receiver + WiFi HTTP POST JSON |
| **Telemetry Simulator** | Python / Async HTTP client | Operational | `scripts/simulate_rx.py` for continuous synthetic/real replay |
| **Time-Series Database** | TimescaleDB / PostgreSQL | Operational | `server/db/schema.sql` (hypertables, rollups, anomaly indexes) |
| **Backend REST API** | Node.js / Express (or FastAPI) | Operational | `/api/telemetry`, `/api/forecast`, `/api/alerts`, `/api/health` |
| **ML/AI Engine** | PyTorch, Scikit-Learn, LightGBM, Statsmodels | Operational | Baselines, LSTM, ARIMA, and `service.py` inference bridge |
| **Frontend UI** | React 19 + TypeScript + Vite + Tailwind CSS | Operational | Clean build (0 errors), responsive lagoon dashboard |
| **Google AI Studio** | Gemini 1.5/2.0 Flash/Pro API & Reasoning | Documented | `docs/GOOGLE_AI_STUDIO_ADVISORY.md` |
| **Containerization** | Docker Multi-stage + Docker Compose | Operational | `docker-compose.yml`, `docker-compose.prod.yml` |
| **Orchestration** | Kubernetes Manifests (`k8s/`) | Operational | StatefulSet, Deployments, Services, Ingress, PVCs |
| **CI/CD Automation** | GitHub Actions Workflow | Operational | `.github/workflows/ci-cd.yml` |
| **Deployment Automation** | Shell / Bash / PowerShell | Operational | `scripts/deploy.sh` (tested on VPS `161.97.134.3`) |

---

## 3) IoT Telemetry Contract (17-Field Payload)

The TTGO LoRa32 transmitter (`Tx.ino`) broadcasts the following 17-field CSV packet over LoRa (EU868, 868.8 MHz), which the receiver (`Rx.ino`) parses and forwards to the backend API as JSON:

```json
{
  "node_name": "MAREA_BUOY_01",
  "seq": 1042,
  "tempOK": 1,
  "temp": 22.45,
  "mpuOK": 1,
  "ax": 0.12,
  "ay": -0.05,
  "az": 9.81,
  "gx": 0.012,
  "gy": -0.008,
  "gz": 0.002,
  "gpsOK": 1,
  "lat": 37.274500,
  "lon": 9.873200,
  "sats": 8,
  "alt": 1.2,
  "hdop": 0.95,
  "rssi": -68,
  "snr": 9.25,
  "timestamp": "2026-08-18T14:30:00.000Z"
}
```

### Hardware Specifications
- **Frequency:** 868.8 MHz (EU868 band)
- **Bandwidth:** 125 kHz | **Spreading Factor:** 7 | **Coding Rate:** 4/5
- **Transmitter (TX):** TTGO LoRa32 V1.3 + DS18B20 (Waterproof temp) + MPU6050 (6-DOF IMU) + NEO-6M GPS
- **Receiver (RX):** TTGO LoRa32 V1.3 + 0.96" SSD1306 OLED Display + WiFi (HTTP POST JSON client)

---

## 4) Historical Dataset & Provenance Findings

- **Archive Location:** `ml/data/raw/Data_modele_to_Bassiana/Data_modele_to_Bassiana/`
- **Main Ingested File:** `Wat_physico_chemical_range.xlsx` (`Physico_Chemical` sheet)
- **Processed Output:** `ml/data/processed/temperature_series.csv` (3,640 daily rows, `2004-01-01` to `2013-12-18`)
- **Temperature Distribution:** Min `11.71°C`, Max `31.30°C`, Mean `21.96°C`, 90th percentile `30.39°C`

### Provenance Observation:
- The supplied historical Excel workbook contains an **exact 365-row repetition cycle** from 2004 to 2013.
- **Scientific Impact:** Seasonal persistence on this historical dataset yields zero error by definition. Therefore, this dataset is designated as a **seasonal climatological reference**, while live IoT buoy measurements supply actual real-time site behavior, anomaly detection, and independent validation.

---

## 5) Machine Learning & Forecasting Models

1. **Persistence Baseline:** Evaluated on held-out test split ($N=727$, $\text{MAE}=0.1516$, $\text{RMSE}=0.2034$, $R^2=0.9990$).
2. **Seasonal Persistence (365-Day):** Evaluated across 1, 3, and 7-day horizons as the climatological reference.
3. **LSTM Deep Learning Architecture:** Implemented in PyTorch (`ml/src/marea_ml/models/lstm.py`) with configurable sequence length ($L=30$), hidden dimensions ($H=64$), and multi-step output projection.
4. **Live Forecasting Service (`ml/src/marea_ml/service.py`):** Real-time inference bridge computing multi-horizon projections from recent database readings.

---

## 6) Database & Backend Architecture

- **Database:** PostgreSQL with TimescaleDB extension.
  - Hypertables partitioned by `timestamp`.
  - Automated continuous aggregates for 1-hour and 1-day averages (`avg_temp`, `min_temp`, `max_temp`, `avg_wave_energy`).
  - Indexes on `(node_name, timestamp DESC)`.
- **API Endpoints:**
  - `POST /api/telemetry` &rarr; Ingest 17-field JSON from IoT RX gateway.
  - `GET /api/telemetry/latest` &rarr; Return latest reading and rate-of-change.
  - `GET /api/telemetry/history?range=24h&interval=5m` &rarr; Downsampled time-series.
  - `GET /api/forecast` &rarr; Live AI-computed temperature trajectory.
  - `GET /api/alerts` &rarr; Active biological/sensor health alerts.
  - `GET /api/health` &rarr; Liveness/readiness probes.

---

## 7) Containerization & Orchestration

### Docker Architecture (`docker-compose.yml`)
- `marea-frontend`: Multi-stage build with Nginx Alpine (exposed on port `8080`).
- `marea-backend`: Node.js Express API server (exposed on port `5000`).
- `marea-ml-service`: Python FastAPI / inference engine (internal port `8000`).
- `marea-db`: TimescaleDB / PostgreSQL (exposed on port `5432`).
- `marea-iot-simulator`: Background service streaming realistic buoy telemetry for automated testing.

### Kubernetes Manifests (`k8s/`)
- `00-namespace.yaml` &rarr; `marea` namespace.
- `01-configmap-secret.yaml` &rarr; Environment variables and credentials.
- `02-timeseries-db.yaml` &rarr; StatefulSet with PersistentVolumeClaim (`10Gi`).
- `03-backend-api.yaml` &rarr; Deployment with rolling updates and readiness probes.
- `04-ai-engine.yaml` &rarr; AI service deployment.
- `05-frontend.yaml` &rarr; Frontend deployment and ClusterIP service.
- `06-ingress.yaml` &rarr; Traefik / Nginx Ingress routing.
- `kustomization.yaml` &rarr; 1-command deployment: `kubectl apply -k k8s/`.

---

## 8) VPS Deployment & Testing Environment

- **VPS Host:** `161.97.134.3` (Debian 13 Cloud Kernel, 12GB RAM, 113GB Free SSD).
- **SSH Access:** `ssh nidhal@161.97.134.3` (Key-based authentication configured).
- **Automated Deployment Script:** `scripts/deploy.sh`
  - Clones/pulls latest code.
  - Builds and starts Docker containers.
  - Executes database schema migrations.
  - Runs end-to-end health verification.

---

## 9) Google AI Studio & Forecasting Enhancement Roadmap

Documented in detail in [`docs/GOOGLE_AI_STUDIO_ADVISORY.md`](file:///c:/Users/xfive/Desktop/Project%20MAREA/docs/GOOGLE_AI_STUDIO_ADVISORY.md):
1. **Multi-Variable Sensor Expansion:** Integration of Dissolved Oxygen (DO), Salinity, Turbidity/Chlorophyll-a, and Barometric Pressure.
2. **Gemini 1.5/2.0 Integration:** Using Gemini Pro for multimodal satellite SST analysis and structured early-warning risk synthesis.
3. **Physics-Informed Hybrid Modeling:** Coupling numerical oceanographic heat-exchange models with deep learning and LLM reasoning.

---

## 10) Commands Reference

### Local Development:
```bash
# Frontend
npm run dev

# Python ML Tests
.venv/Scripts/python.exe -m pytest ml/tests/ -q

# Run IoT Telemetry Simulator
python scripts/simulate_rx.py --url http://localhost:5000/api/telemetry
```

### Docker Local Stack:
```bash
docker compose up --build -d
```

### VPS Staging Deployment:
```bash
ssh nidhal@161.97.134.3 "cd /home/nidhal/MAREA && bash scripts/deploy.sh"
```
