import dotenv from 'dotenv';
dotenv.config();

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';
import tasksRouter from './routes/tasks';
import sessionsRouter from './routes/sessions';
import feedRouter from './routes/feed';
import eventsRouter from './routes/events';
import connectorsRouter, { googleCallbackRouter } from './routes/connectors';
import { bbClient, isBrowserbaseConfigured } from './services/browserbase';
import { isLlmConfigured } from './services/agentEngine';
import { startScheduler } from './services/scheduler';
import { isGoogleConfigured } from './services/google';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const API_TOKEN = process.env.MUSE_API_TOKEN;
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);

app.use(cors(CORS_ORIGINS?.length ? { origin: CORS_ORIGINS } : undefined));
app.use(express.json({ limit: '1mb' }));

// Health & Status check (public)
app.get('/api/health', async (_req, res) => {
  let bbStatus = 'UNCONFIGURED';
  if (isBrowserbaseConfigured()) {
    try {
      await bbClient.projects.list();
      bbStatus = 'CONNECTED';
    } catch (e: any) {
      bbStatus = `ERROR: ${e.message}`;
    }
  }

  res.json({
    status: 'OK',
    serverTime: new Date().toISOString(),
    authRequired: !!API_TOKEN,
    llm: { configured: isLlmConfigured(), model: process.env.GEMINI_MODEL || 'gemini-flash-latest' },
    browserbase: { status: bbStatus, hasApiKey: isBrowserbaseConfigured() },
    google: { configured: isGoogleConfigured() },
  });
});

// Public: Google redirects the browser here after consent
app.use('/api/connectors/google', googleCallbackRouter);

// Optional shared-secret auth so a public/LAN server can't be used to burn API credits
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (!API_TOKEN) return next();
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : (req.query.token as string | undefined);
  if (token === API_TOKEN) return next();
  return res.status(401).json({ success: false, error: 'Unauthorized' });
});

app.use('/api/chat', chatRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/events', eventsRouter);
app.use('/api/connectors', connectorsRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n[Muse AI Backend] listening on http://0.0.0.0:${PORT}`);
  console.log(`  LLM (Gemini): ${isLlmConfigured() ? 'configured' : 'NOT configured - basic mode'}`);
  console.log(`  Browserbase:  ${isBrowserbaseConfigured() ? 'configured' : 'NOT configured - fetch fallback'}`);
  console.log(`  Google:       ${isGoogleConfigured() ? 'configured (Gmail/Calendar connectors)' : 'NOT configured'}`);
  console.log(`  Auth token:   ${API_TOKEN ? 'required' : 'disabled'}\n`);
  startScheduler();
});
