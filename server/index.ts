import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import tasksRouter from './routes/tasks';
import sessionsRouter from './routes/sessions';
import { bbClient } from './services/browserbase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health & Status check
app.get('/api/health', async (_req, res) => {
  let bbStatus = 'UNCONFIGURED';
  if (process.env.BROWSERBASE_API_KEY) {
    try {
      const projects = await bbClient.projects.list();
      bbStatus = projects.length > 0 ? 'CONNECTED' : 'KEY_VALID_NO_PROJECTS';
    } catch (e: any) {
      bbStatus = `ERROR: ${e.message}`;
    }
  }

  res.json({
    status: 'OK',
    serverTime: new Date().toISOString(),
    browserbase: {
      status: bbStatus,
      hasApiKey: !!process.env.BROWSERBASE_API_KEY,
    },
  });
});

// Mount Routes
app.use('/api/chat', chatRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/sessions', sessionsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`\n🤖 [Muse AI Backend] Server running on http://localhost:${PORT}`);
  console.log(`🌐 [Browserbase Status] API Key configured: ${!!process.env.BROWSERBASE_API_KEY}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   • GET  /api/health`);
  console.log(`   • POST /api/chat`);
  console.log(`   • GET  /api/tasks & POST /api/tasks/run`);
  console.log(`   • GET  /api/sessions\n`);
});
