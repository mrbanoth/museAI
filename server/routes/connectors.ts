import { Router, Request, Response } from 'express';
import {
  buildAuthUrl,
  connectionStatus,
  disconnect,
  handleCallback,
  isGoogleService,
} from '../services/google';
import { emitEvent } from '../services/events';
import { runAsUser } from '../services/userContext';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  return res.json({ success: true, connectors: connectionStatus() });
});

/**
 * Returns the Google consent URL for a connector; the app opens it in a browser.
 */
router.post('/:id/connect', (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!isGoogleService(id)) return res.status(404).json({ success: false, error: 'Unknown connector' });
  try {
    const url = buildAuthUrl(id, typeof req.body?.returnTo === 'string' ? req.body.returnTo : undefined);
    return res.json({ success: true, url });
  } catch (e: any) {
    return res.status(503).json({ success: false, error: e.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!isGoogleService(id)) return res.status(404).json({ success: false, error: 'Unknown connector' });
  await disconnect(id);
  emitEvent('connector.updated', { id, connected: false });
  return res.json({ success: true });
});

export default router;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function resultPage(title: string, message: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F8FAFC">
<div style="text-align:center;padding:24px;max-width:420px"><h2 style="color:#0F172A">${escapeHtml(title)}</h2>
<p style="color:#475569">${escapeHtml(message)}</p><p style="color:#94A3B8">You can close this window and return to Muse AI.</p></div></body></html>`;
}

/**
 * Public OAuth redirect target (Google cannot send our API token).
 */
export const googleCallbackRouter = Router();

googleCallbackRouter.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string | undefined>;
  if (error || !code || !state) {
    return res.status(400).send(resultPage('Connection cancelled', error || 'Missing authorization code.'));
  }
  try {
    const result = await handleCallback(code, state);
    runAsUser(result.owner, () => emitEvent('connector.updated', { id: result.service, connected: true, email: result.email }));
    if (result.returnTo) {
      const back = new URL(result.returnTo);
      back.searchParams.set('connector', result.service);
      back.searchParams.set('status', 'connected');
      return res.redirect(back.toString());
    }
    return res.send(resultPage(`${result.name} connected`, result.email ? `Linked ${result.email}.` : 'Account linked.'));
  } catch (e: any) {
    return res.status(400).send(resultPage('Connection failed', e.message));
  }
});
