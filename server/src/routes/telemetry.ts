import { Router, Request, Response } from 'express';
import { insertTelemetry, getLatestTelemetry, getTelemetryHistory, TelemetryPacket } from '../db.js';

export const telemetryRouter = Router();

// Ingest telemetry JSON from TTGO LoRa32 RX gateway or simulator
telemetryRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    
    // Support either node_name or nodeName
    const packet: TelemetryPacket = {
      node_name: data.node_name || data.nodeName || 'MAREA_BUOY_01',
      seq: Number(data.seq) || 0,
      tempOK: data.tempOK !== undefined ? data.tempOK : true,
      temp: Number(data.temp) || 20.0,
      mpuOK: data.mpuOK !== undefined ? data.mpuOK : true,
      ax: Number(data.ax) || 0.0,
      ay: Number(data.ay) || 0.0,
      az: Number(data.az) || 9.81,
      gx: Number(data.gx) || 0.0,
      gy: Number(data.gy) || 0.0,
      gz: Number(data.gz) || 0.0,
      gpsOK: data.gpsOK !== undefined ? data.gpsOK : true,
      lat: Number(data.lat) || 37.2745,
      lon: Number(data.lon) || 9.8732,
      sats: Number(data.sats) || 0,
      alt: Number(data.alt) || 0.0,
      hdop: Number(data.hdop) || 1.0,
      rssi: Number(data.rssi) || -70,
      snr: Number(data.snr) || 8.0,
      time: data.timestamp || data.time || new Date().toISOString()
    };

    const inserted = await insertTelemetry(packet);
    res.status(201).json({ success: true, message: 'Telemetry ingested successfully', data: inserted });
  } catch (err) {
    console.error('[API] Telemetry ingestion error:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Get latest reading
telemetryRouter.get('/latest', async (req: Request, res: Response): Promise<void> => {
  try {
    const node = req.query.node as string | undefined;
    const latest = await getLatestTelemetry(node);
    if (!latest) {
      // Return default reference state if no live reading yet
      res.json({
        success: true,
        data: {
          node_name: "MAREA_BUOY_01",
          seq: 0,
          temp: 21.96,
          temp_ok: true,
          tempOK: 1,
          ax: 0.05,
          ay: -0.02,
          az: 9.81,
          gx: 0.001,
          gy: 0.002,
          gz: -0.001,
          mpu_ok: true,
          mpuOK: 1,
          lat: 37.2745,
          lon: 9.8732,
          sats: 8,
          alt: 1.0,
          hdop: 0.9,
          gps_ok: true,
          gpsOK: 1,
          rssi: -65,
          snr: 9.5,
          time: new Date().toISOString(),
          is_simulated_reference: true
        }
      });
      return;
    }
    res.json({ success: true, data: latest });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Get history readings
telemetryRouter.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const node = req.query.node as string | undefined;
    const history = await getTelemetryHistory(limit, node);
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});
