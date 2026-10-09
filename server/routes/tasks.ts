import { Router, Request, Response } from 'express';
import { runCloudBrowserAutomation, createCloudSession } from '../services/browserbase';

const router = Router();

// In-memory tasks store initialized with default Muse AI goals
const TASK_STORE = [
  {
    id: 'task-1',
    title: 'Track Top AI Model Leaderboards',
    schedule: 'Daily at 9:00 AM',
    url: 'https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard',
    status: 'ACTIVE',
    lastExecuted: 'Yesterday',
    lastSessionId: null as string | null,
    lastReplayUrl: null as string | null,
  },
  {
    id: 'task-2',
    title: 'Monitor Tech News & Hacker News Stories',
    schedule: 'Every 6 hours',
    url: 'https://news.ycombinator.com',
    status: 'ACTIVE',
    lastExecuted: '3 hours ago',
    lastSessionId: null as string | null,
    lastReplayUrl: null as string | null,
  },
  {
    id: 'task-3',
    title: 'Weekly GitHub Trending Repositories Scraper',
    schedule: 'Weekly on Mondays',
    url: 'https://github.com/trending',
    status: 'ACTIVE',
    lastExecuted: '4 days ago',
    lastSessionId: null as string | null,
    lastReplayUrl: null as string | null,
  },
];

router.get('/', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    tasks: TASK_STORE,
  });
});

router.post('/run', async (req: Request, res: Response) => {
  try {
    const { taskId, customUrl, taskTitle } = req.body;

    const existingTask = TASK_STORE.find((t) => t.id === taskId);
    const targetUrl = customUrl || existingTask?.url || 'https://news.ycombinator.com';
    const description = taskTitle || existingTask?.title || 'Autonomous Routine Run';

    console.log(`[Task Runner] Starting Browserbase task "${description}" at ${targetUrl}`);

    const result = await runCloudBrowserAutomation(targetUrl, description, async (page) => {
      const title = await page.title();
      const firstHeading = await page.locator('h1, h2, .title, a').first().textContent().catch(() => '');
      return {
        title,
        extractedSummary: `Successfully extracted data from ${new URL(targetUrl).hostname}: "${firstHeading?.trim()}"`,
        timestamp: new Date().toISOString(),
      };
    });

    if (existingTask) {
      existingTask.lastExecuted = 'Just now';
      existingTask.lastSessionId = result.sessionId;
      existingTask.lastReplayUrl = result.replayUrl;
    }

    return res.json({
      success: result.status === 'COMPLETED',
      sessionId: result.sessionId,
      liveViewUrl: result.liveViewUrl,
      replayUrl: result.replayUrl,
      status: result.status,
      data: result.data,
      message: `Goal "${description}" ran successfully in Browserbase cloud browser!`,
    });
  } catch (err: any) {
    console.error('[Task Run Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to run task in cloud browser',
    });
  }
});

export default router;
