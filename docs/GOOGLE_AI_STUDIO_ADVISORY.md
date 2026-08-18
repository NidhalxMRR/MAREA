# Google AI Studio Advisory Report: Environmental Forecasting & Multimodal Enhancement Blueprint

**Project:** MAREA (*Marine Aquaculture Risk & Early-warning Analytics*)  
**Target Environment:** Bizerte Lagoon, Tunisia (Semi-enclosed Mediterranean Coastal Lagoon)  
**Date:** August 2026  
**Document Classification:** Scientific, AI/ML Architecture & Sensor Engineering Advisory  

---

## 1. Executive Summary

This advisory report provides scientific and technical guidance for integrating **Google AI Studio** and **Gemini 1.5/2.0 Pro & Flash** models into Project MAREA to transform raw IoT buoy telemetry and historical reference series into an advanced, physics-informed environmental forecasting and early-warning platform for marine aquaculture.

The current system captures live 17-field telemetry (water temperature, 6-DOF IMU wave dynamics, GPS drift, RF metrics). This document identifies missing critical oceanographic variables, outlines physics-guided ML architectures, and provides ready-to-use prompt blueprints, security guardrails, and structured schemas for Google AI Studio.

---

## 2. Telemetry & Data Audit

### 2.1 Current Live IoT Contract (17-Field TTGO LoRa32 Stream)
The operational IoT node provides:
1. **Water Temperature ($T$ in °C):** Waterproof DS18B20 digital sensor (0.0625°C resolution).
2. **Dynamic Motion & Wave Surges ($a_x, a_y, a_z$ in $\text{m/s}^2$):** MPU6050 3-axis accelerometer capturing heave, surge, and wave energy.
3. **Angular Velocity ($\omega_x, \omega_y, \omega_z$ in $\text{rad/s}$):** MPU6050 3-axis gyroscope capturing wave pitch and roll periods.
4. **Mooring & Geolocation ($\text{Lat}, \text{Lon}, \text{Alt}, \text{HDOP}, \text{Sats}$):** NEO-6M GPS monitoring buoy position, tidal drift, and mooring integrity.
5. **RF Link Diagnostics ($\text{RSSI}, \text{SNR}$):** LoRa 868.8 MHz transmission health.

### 2.2 Historical Reference Dataset Provenance
- **Dataset Source:** `Wat_physico_chemical_range.xlsx` (`2004-01-01` to `2013-12-18`, 3,640 daily rows).
- **Core Observation:** The historical temperature series exhibits an **exact 365-row repetition cycle** across all 10 years.
- **Scientific Conclusion for AI Studio:**
  - The historical dataset serves as a **deterministic climatological annual reference**, *not* independent-year generalization data.
  - Deep learning models (LSTM, Transformers) trained solely on this historical series will overfit to the exact harmonic curve.
  - **Enhancement Requirement:** Gemini AI must fuse the live IoT stream with numerical thermodynamic energy-balance models to predict real-world deviations, marine heatwaves, and rapid stratification.

---

## 3. Critical Missing Environmental Variables

To elevate MAREA from sea-temperature projection to a comprehensive aquaculture risk intelligence system, the following multi-parametric sensors should be integrated into future buoy revisions:

```
+---------------------------------------------------------------------------------------+
|                       PRIORITY SENSOR EXPANSION ROADMAP                               |
+--------------------------+-----------------------+------------------------------------+
| Variable                 | Recommended Sensor    | Aquaculture / AI Impact            |
+--------------------------+-----------------------+------------------------------------+
| Dissolved Oxygen (DO)    | Optical DO (e.g. DFR) | Predicts nocturnal hypoxia & fish  |
|                          |                       | mortality during thermal peaks.   |
| Salinity / Conductivity  | Toroidal / 4-Electrode| Detects freshwater lagoon runoff & |
|                          | EC Sensor             | osmotic stress on seabass/seabream |
| Chlorophyll-a / Turbidity| Optical Fluorometer   | Early warning for Harmful Algal    |
|                          |                       | Blooms (HABs) & eutrophication.    |
| Barometric Pressure      | BMP280 / BME280       | Crucial for atmospheric heat-flux  |
|                          |                       | and sudden storm squall alerts.    |
| Wind Speed & Direction   | Ultrasonic Anemometer | Quantifies wind-driven mixing and  |
|                          |                       | lagoon thermal destratification.   |
+--------------------------+-----------------------+------------------------------------+
```

---

## 4. Chatbot Agent Upgrade: Gemini API Key & Strict Security Guardrails

### 4.1 Diagnosis of Current "Ask MAREA" Chat Assistant
The current "Ask MAREA" chatbot assistant operates on **static, hardcoded keyword matching** (`if (q.includes(...))`). This causes several critical limitations:
1. **Static / Scripted Responses:** The agent cannot reason dynamically over new or complex environmental questions.
2. **Lack of Guardrails:** When an operator enters an off-topic query (e.g. *"how to make mochitos"* or unrelated coding queries), the chatbot repeats a fallback lagoon sentence instead of gracefully handling domain boundaries.
3. **Missing Live AI Linkage:** The chatbot is not yet connected to a live LLM API endpoint.

### 4.2 Required Solution: Gemini API Key Prompt & Real-Time Grounding
To activate true generative reasoning, the system requires:
1. **Interactive API Key Prompt:** A UI banner/dialog prompting the operator to insert their **Google Gemini API Key** (`gemini-1.5-flash` or `gemini-2.0-flash`), stored securely in `localStorage` or injected via server environment variables (`GEMINI_API_KEY`).
2. **Context Injection:** Feeding the latest 17-field buoy observation, temperature thresholds, rate of change, and site context into every prompt.
3. **Strict Domain Guardrails:** Enforcing that the model **exclusively** answers questions related to MAREA and Bizerte Lagoon, immediately rejecting any general/unrelated questions.

### 4.3 Security Guardrails System Prompt for Google AI Studio

```text
You are MAREA Environmental Intelligence Assistant, a specialized AI copilot for Project MAREA and the Bizerte Lagoon Marine Aquaculture Zone in Tunisia.

CRITICAL SECURITY GUARDRAILS & DOMAIN RESTRICTIONS:
1. STRICT DOMAIN CONSTRAINT: You ONLY answer questions regarding:
   - Project MAREA architecture, hardware, and algorithms.
   - Bizerte Lagoon oceanography, water temperature, and coastal environmental conditions.
   - European Seabass (Dicentrarchus labrax), Gilthead Seabream (Sparus aurata), and Mussel aquaculture physiological limits.
   - Real-time IoT buoy telemetry (water temperature, MPU6050 wave dynamics/acceleration/gyro, GPS coordinates, RSSI/SNR).
   - Sensor thresholds, thermal rate of change, marine heatwave risks, and hypoxia early warnings.
   - Historical dataset provenance and seasonal baselines.

2. REJECTION OF OFF-TOPIC QUERIES:
   If the user asks ANY question outside this domain (e.g., cooking recipes, general programming, cocktails, politics, entertainment, personal advice, trivia, etc.):
   You MUST politely but firmly refuse to answer using this exact format:
   "I am MAREA's specialized marine environmental assistant. I am strictly restricted to assisting with Project MAREA, Bizerte Lagoon aquaculture, buoy telemetry, and environmental early warning analytics. Please ask a question related to lagoon water conditions, sensor readings, or thermal risk thresholds."

3. GROUNDING IN LIVE DATA:
   Base your technical answers on the live telemetry and system metrics provided in the system context. Do not invent non-existent sensor values or fabricated historical records.
```

---

## 5. Google AI Studio & Gemini Integration Blueprint

### 5.1 Architecture: Hybrid Physics-Informed ML + LLM Reasoning

```
                                 [Live IoT Buoy Telemetry (17 Fields)]
                                                |
                                                v
                              +-----------------------------------+
                              |   TimescaleDB Time-Series Engine  |
                              +-----------------+-----------------+
                                                |
                      +-------------------------+-------------------------+
                      |                                                   |
                      v                                                   v
         +--------------------------+                        +--------------------------+
         |  Numerical Physics Core  |                        |  Satellite SST & Weather |
         |   1D Heat Exchange Model |                        |  Copernicus / Open-Meteo |
         +------------+-------------+                        +------------+-------------+
                      |                                                   |
                      +-------------------------+-------------------------+
                                                |
                                                v
                              +-----------------------------------+
                              |    Google AI Studio / Gemini API  |
                              |  - Multi-Horizon Trajectory Model |
                              |  - Physiological Risk Synthesis   |
                              |  - Actionable Mitigation Commands |
                              +-----------------+-----------------+
                                                |
                                                v
                              +-----------------------------------+
                              |      MAREA React Dashboard UI     |
                              |  - Real-Time Risk Matrix          |
                              |  - Interactive "Ask MAREA" Copilot|
                              +-----------------+-----------------+
```

### 5.2 Mathematical Heat Flux Formulation for AI Reasoning
Gemini evaluates net sea surface heat flux ($Q_{\text{net}}$):

$$Q_{\text{net}} = Q_{\text{sw}} - Q_{\text{lw}} - Q_{\text{sensible}} - Q_{\text{latent}}$$

Where:
- $Q_{\text{sw}}$ = Shortwave solar radiation (computed from solar angle and cloud cover).
- $Q_{\text{lw}}$ = Longwave net atmospheric back-radiation.
- $Q_{\text{sensible}} = \rho_a C_p C_H U (T_{\text{water}} - T_{\text{air}})$ (Sensible heat transfer influenced by wind speed $U$).
- $Q_{\text{latent}} = \rho_a L_v C_E U (q_{\text{water}} - q_{\text{air}})$ (Evaporative cooling).

When $Q_{\text{net}} > 0$ with low wind speed ($U < 2\text{ m/s}$ derived from low IMU wave acceleration $a_z$), the model forecasts **accelerated lagoon surface overheating**.

---

## 6. Structured Output JSON Schema for Google AI Studio

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MareaEnvironmentalAssessment",
  "type": "object",
  "properties": {
    "site": { "type": "string", "example": "Bizerte Lagoon Aquaculture Zone" },
    "assessment_timestamp": { "type": "string", "format": "date-time" },
    "current_conditions": {
      "type": "object",
      "properties": {
        "water_temperature": { "type": "number", "description": "Current temperature in °C" },
        "thermal_state": { "type": "string", "enum": ["OPTIMAL", "ELEVATED", "HEATWAVE_WARNING", "HYPOTHERMIA_RISK"] },
        "wave_dynamics": {
          "type": "object",
          "properties": {
            "surface_energy_index": { "type": "string", "enum": ["CALM_STRATIFIED", "MODERATE_SWELL", "ROUGH_MIXING"] },
            "wave_acceleration_rms": { "type": "number" }
          }
        }
      },
      "required": ["water_temperature", "thermal_state", "wave_dynamics"]
    },
    "forecast_projections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "horizon_hours": { "type": "integer" },
          "predicted_temp": { "type": "number" },
          "confidence_interval_95": {
            "type": "object",
            "properties": {
              "lower": { "type": "number" },
              "upper": { "type": "number" }
            }
          },
          "primary_forcing_factor": { "type": "string" }
        },
        "required": ["horizon_hours", "predicted_temp", "confidence_interval_95"]
      }
    },
    "risk_analysis": {
      "type": "object",
      "properties": {
        "seabass_seabream_risk": { "type": "string", "enum": ["LOW", "MODERATE", "HIGH", "CRITICAL"] },
        "mussel_culture_risk": { "type": "string", "enum": ["LOW", "MODERATE", "HIGH", "CRITICAL"] },
        "hypoxia_probability_percent": { "type": "number", "minimum": 0, "maximum": 100 },
        "scientific_rationale": { "type": "string" }
      },
      "required": ["seabass_seabream_risk", "mussel_culture_risk", "hypoxia_probability_percent", "scientific_rationale"]
    },
    "actionable_farmer_recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["site", "assessment_timestamp", "current_conditions", "forecast_projections", "risk_analysis", "actionable_farmer_recommendations"]
}
```

---

## 7. Actionable Implementation Checklist for Researchers

1. **Insert Gemini API Key:** Operators configure their key directly in the "Ask MAREA" panel or `.env`.
2. **Deploy the Ingestion API & Time-Series DB:** Run `scripts/deploy.sh` on the VPS to capture all incoming IoT packets.
3. **Collect 30 Days of Continuous In-Situ Telemetry:** Establish true lagoon baseline variance against the historical 10-year reference.
4. **Integrate Dissolved Oxygen (DO) Sensor:** Priority #1 hardware expansion for water quality and hypoxia prevention.
5. **Calibrate Numerical Heat Flux Coefficients:** Use the Bizerte Lagoon surface area ($128\text{ km}^2$) and mean depth ($7\text{ m}$) for physics loss regularization in model training.
