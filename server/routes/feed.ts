import { Router, Request, Response } from 'express';
import { Store } from '../services/store';
import { emitEvent } from '../services/events';
import { processAgentChat } from '../services/agentEngine';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  return res.json({ success: true, feed: Store.listFeed() });
});

/**
 * Runs a 1-tap idea through the agent and posts the generated result to the feed.
 */
router.post('/run-idea', async (req: Request, res: Response) => {
  const { ideaId, title, prompt, requestId } = req.body || {};
  if (!title || !prompt) {
    return res.status(400).json({ success: false, error: 'Fields "title" and "prompt" are required.' });
  }

  try {
    console.log(`[Idea Runner] "${title}"`);
    const result = await processAgentChat(prompt, [], requestId || `idea:${ideaId || Date.now()}`);
    const browser = result.actions.find((a) => a.replayUrl);

    const feedItem = Store.addFeed({
      category: '1-Tap Idea Execution',
      title,
      summary: result.reply,
      sourceUrl: result.actions.find((a) => a.url)?.url,
      replayUrl: browser?.replayUrl,
      screenshotUrl: result.actions.find((a) => a.screenshotUrl)?.screenshotUrl,
      tags: ['Idea', result.engine === 'gemini' ? 'AI generated' : 'Raw results'],
      icon: 'idea',
    });
    emitEvent('feed.added', feedItem);

    return res.json({
      success: true,
      feedItem,
      replayUrl: browser?.replayUrl,
      message: `"${title}" finished and was posted to your Feed.`,
    });
  } catch (err: any) {
    console.error('[Idea Execution Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to execute idea' });
  }
});

export default router;
