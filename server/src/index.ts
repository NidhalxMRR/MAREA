import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { telemetryRouter } from './routes/telemetry.js';
import { forecastRouter } from './routes/forecast.js';
import { alertsRouter } from './routes/alerts.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/telemetry', telemetryRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/alerts', alertsRouter);

// Health check endpoint for Docker & K8s probes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    system: 'MAREA Environmental Intelligence Platform',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve frontend build if dist folder is present
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('MAREA API Backend is active. Frontend build will be served here once generated.');
    }
  });
});

// Start Server
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  MAREA BACKEND SERVER RUNNING ON PORT ${PORT}`);
    console.log(`  Health: http://localhost:${PORT}/api/health`);
    console.log(`  Telemetry Ingestion: POST http://localhost:${PORT}/api/telemetry`);
    console.log(`  Forecast: GET http://localhost:${PORT}/api/forecast`);
    console.log(`====================================================`);
  });
}

start();
