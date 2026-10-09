import { Router, Request, Response } from 'express';
import { listRecentSessions, bbClient } from '../services/browserbase';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const sessions = await listRecentSessions(10);
    return res.json({
      success: true,
      sessions,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to list sessions',
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const session = await bbClient.sessions.retrieve(sessionId);
    return res.json({
      success: true,
      session,
      liveViewUrl: `https://www.browserbase.com/sessions/${session.id}`,
      replayUrl: `https://www.browserbase.com/sessions/${session.id}`,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      error: error.message || 'Session not found',
    });
  }
});

export default router;
