import { Router, Request, Response } from 'express';
import { getLatestTelemetry, getTelemetryHistory, getActiveAlerts } from '../db.js';

export const chatRouter = Router();

const GUARDRAIL_REFUSAL = 
  "I am MAREA's specialized marine environmental assistant. I am strictly restricted to assisting with Project MAREA, Bizerte Lagoon aquaculture, buoy telemetry, and environmental early warning analytics. Please ask a question related to lagoon water conditions, sensor readings, or thermal risk thresholds.";

chatRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const latest = await getLatestTelemetry();
    const historyData = await getTelemetryHistory(10);
    const alerts = await getActiveAlerts();

    const currentTemp = latest ? Number(latest.temp).toFixed(2) : '22.00';
    const ax = latest ? Number(latest.ax).toFixed(3) : '0.000';
    const ay = latest ? Number(latest.ay).toFixed(3) : '0.000';
    const az = latest ? Number(latest.az).toFixed(3) : '9.810';
    const lat = latest ? Number(latest.lat).toFixed(6) : '37.274500';
    const lon = latest ? Number(latest.lon).toFixed(6) : '9.873200';
    const rssi = latest ? Number(latest.rssi) : -70;
    const snr = latest ? Number(latest.snr) : 8.0;

    // Check for off-topic query in quick filter
    const q = message.toLowerCase();
    const offTopicKeywords = [
      "mochito", "mojito", "cocktail", "recipe", "cook", "drink", "food",
      "joke", "song", "movie", "game", "politics", "president", "bitcoin",
      "crypto", "weather in paris", "weather in london", "who made you"
    ];

    if (offTopicKeywords.some(w => q.includes(w))) {
      res.json({
        success: true,
        message: GUARDRAIL_REFUSAL,
        source: 'guardrail_filter'
      });
      return;
    }

    if (apiKey) {
      try {
        const systemPrompt = `You are MAREA Environmental Intelligence Assistant for Project MAREA and the Bizerte Lagoon Marine Aquaculture Zone in Tunisia.

CRITICAL DOMAIN GUARDRAIL:
You ONLY answer questions directly related to:
1. Project MAREA architecture, IoT hardware (TTGO LoRa32, DS18B20, MPU6050, GPS NEO-6M).
2. Bizerte Lagoon oceanography, sea-water temperature, and coastal environmental conditions.
3. European Seabass (Dicentrarchus labrax), Gilthead Seabream (Sparus aurata), and Mussel aquaculture physiological limits (optimal 18-24°C, stress >26.5°C, critical >29°C).
4. Real-time buoy telemetry, wave dynamics/acceleration, GPS coordinates, RSSI/SNR.
5. Temperature rate-of-change, marine heatwave risks, hypoxia early warnings.
6. Historical dataset provenance and seasonal baselines.

REJECTION RULE:
If the user asks ANY question outside this domain (e.g. recipes, cocktails like mochitos, general programming, jokes, politics, weather outside Bizerte, non-marine topics):
You MUST politely refuse using this exact message:
"${GUARDRAIL_REFUSAL}"

GROUND TRUTH LIVE BUOY TELEMETRY:
- Site: Bizerte Lagoon Aquaculture Zone (37.2745° N, 9.8732° E, Bizerte, Tunisia)
- Latest Water Temperature: ${currentTemp} °C
- IMU Wave Acceleration: (X: ${ax}, Y: ${ay}, Z: ${az} m/s²)
- GPS Coordinates: Lat ${lat}, Lon ${lon}
- LoRa Link Health: RSSI ${rssi} dBm, SNR ${snr} dB
- Active Threshold Alerts: ${alerts.length} active alerts
- Safe Thermal Range for Seabass/Seabream: 14.0°C to 28.5°C (Optimum: 18-24°C)
- Historical Annual Mean: 21.96 °C (2004 to 2013)`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nOperator Question: ${message}` }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 600,
            }
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            res.json({
              success: true,
              message: reply,
              source: 'gemini_ai_live'
            });
            return;
          }
        } else {
          const errText = await geminiRes.text();
          console.warn('[Gemini API] Remote API returned error status, using grounded fallback:', errText);
        }
      } catch (err) {
        console.error('[Gemini API] Request exception:', err);
      }
    }

    // Fallback Grounded Engine
    let reply = "";
    if (q.includes("summarize") || q.includes("condition")) {
      reply = `Current observation for Bizerte Lagoon: latest water temperature is ${currentTemp} °C (normal operating range: 14.0°C – 28.5°C). Wave dynamics indicate active acceleration (Z: ${az} m/s²). Historical annual average for this lagoon is 21.96 °C.`;
    } else if (q.includes("seasonal") || q.includes("reference")) {
      reply = `The seasonal reference is extracted from the researcher workbook (Wat_physico_chemical_range.xlsx). In this dataset, daily values repeat identically every 365 days across 3,275 compared pairs. It represents the expected historical seasonal cycle for Bizerte Lagoon, but is not an operational forecast.`;
    } else if (q.includes("fast") || q.includes("rate") || q.includes("change")) {
      reply = `Rate of change tracking analyzes consecutive timestamped sensor readings from the TTGO LoRa32 buoy. In marine aquaculture, rapid swings exceeding 1.5 °C within a few hours indicate potential thermal shock or stratified layer movement.`;
    } else if (q.includes("sensor") || q.includes("hardware") || q.includes("reporting")) {
      reply = `The MAREA buoy node uses a TTGO LoRa32 V1.3 with a DS18B20 1-Wire water probe, MPU6050 IMU, and GPS. It broadcasts a 17-field CSV telemetry packet every 32 seconds at 868.8 MHz.`;
    } else if (q.includes("baseline") || q.includes("model") || q.includes("forecast")) {
      reply = `Persistence baseline achieves MAE 0.151 °C (1-day horizon). Multi-horizon AI predictions are updated live in the database combining thermal persistence and seasonal harmonic curves.`;
    } else {
      reply = `Understood. Based on MAREA's live records for Bizerte Lagoon: current temperature is ${currentTemp} °C, active temperature thresholds [14.0°C – 28.5°C], and GPS position (${lat}, ${lon}).`;
    }

    res.json({
      success: true,
      message: reply,
      source: 'grounded_local_engine'
    });
  } catch (err) {
    console.error('[API] Chat error:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});
