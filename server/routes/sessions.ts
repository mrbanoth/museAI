import { Router, Request, Response } from 'express';
import { listRecentSessions, bbClient, isBrowserbaseConfigured } from '../services/browserbase';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const sessions = await listRecentSessions(10);
    return res.json({ success: true, sessions });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to list sessions' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  if (!isBrowserbaseConfigured()) {
    return res.status(503).json({ success: false, error: 'Browserbase is not configured' });
  }
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const session = await bbClient.sessions.retrieve(sessionId);
    let liveViewUrl: string | undefined;
    if (session.status === 'RUNNING') {
      liveViewUrl = (await bbClient.sessions.debug(sessionId).catch(() => null))?.debuggerFullscreenUrl;
    }
    return res.json({
      success: true,
      session,
      liveViewUrl,
      replayUrl: `https://www.browserbase.com/sessions/${session.id}`,
    });
  } catch (error: any) {
    return res.status(404).json({ success: false, error: error.message || 'Session not found' });
  }
});

export default router;
