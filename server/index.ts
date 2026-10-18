import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import chatRouter from './routes/chat';
import tasksRouter from './routes/tasks';
import feedRouter from './routes/feed';
import eventsRouter from './routes/events';
import legalRouter from './routes/legal';
import connectorsRouter, { googleCallbackRouter } from './routes/connectors';
import { bbClient, isBrowserbaseConfigured } from './services/browserbase';
import { isLlmConfigured } from './services/agentEngine';
import { startScheduler } from './services/scheduler';
import { requireAuth, isAuthEnabled, limitAgentRuns, getUsage } from './services/auth';
import { currentUser } from './services/userContext';
import { isGoogleConfigured } from './services/google';

const app = express();
const PORT = Number(process.env.PORT || 3001);
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
    authRequired: isAuthEnabled(),
    llm: { configured: isLlmConfigured(), model: process.env.GEMINI_MODEL || 'gemini-flash-latest' },
    browserbase: { status: bbStatus, hasApiKey: isBrowserbaseConfigured() },
    google: { configured: isGoogleConfigured() },
  });
});

// Public privacy policy (linked from Google's OAuth consent screen)
app.use(legalRouter);

// Public: Google redirects the browser here after consent
app.use('/api/connectors/google', googleCallbackRouter);

// Everything below requires a verified user (see services/auth.ts)
app.use('/api', requireAuth);

// Signed-in user's profile: usage today and which capabilities are live on this server
app.get('/api/me', (_req, res) => {
  const user = currentUser();
  res.json({
    success: true,
    email: user,
    usage: getUsage(user),
    services: {
      ai: isLlmConfigured(),
      browser: isBrowserbaseConfigured(),
      google: isGoogleConfigured(),
    },
  });
});

// Agent runs cost money: cap them per user per day (DAILY_AGENT_LIMIT, default 100)
const agentLimit = limitAgentRuns(currentUser);
app.post('/api/chat', agentLimit);
app.post('/api/feed/run-idea', agentLimit);
app.post('/api/tasks/:id/run', agentLimit);

app.use('/api/chat', chatRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/feed', feedRouter);
app.use('/api/events', eventsRouter);
app.use('/api/connectors', connectorsRouter);

// Serve the exported web app (npm run build) from the same origin, with SPA fallback
const WEB_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(path.join(WEB_DIR, 'index.html'))) {
  app.use(express.static(WEB_DIR));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(WEB_DIR, 'index.html')));
  console.log('[Muse AI Backend] serving web app from dist/');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n[Muse AI Backend] listening on http://0.0.0.0:${PORT}`);
  console.log(`  LLM (Gemini): ${isLlmConfigured() ? 'configured' : 'NOT configured - basic mode'}`);
  console.log(`  Browserbase:  ${isBrowserbaseConfigured() ? 'configured' : 'NOT configured - fetch fallback'}`);
  console.log(`  Google:       ${isGoogleConfigured() ? 'configured (Gmail/Calendar connectors)' : 'NOT configured'}`);
  console.log(`  API auth:     ${isAuthEnabled() ? 'required' : 'DISABLED (set ALLOWED_EMAILS before deploying)'}\n`);
  startScheduler();
});
