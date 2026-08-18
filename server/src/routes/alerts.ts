import { Router, Request, Response } from 'express';
import { getActiveAlerts } from '../db.js';

export const alertsRouter = Router();

alertsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await getActiveAlerts();
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});
