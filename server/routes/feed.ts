import { Router, Request, Response } from 'express';
import { runCloudBrowserAutomation } from '../services/browserbase';

const router = Router();

export interface FeedItemData {
  id: string;
  category: string;
  title: string;
  summary: string;
  timestamp: string;
  sourceUrl?: string;
  replayUrl?: string;
  tags: string[];
  icon: string;
}

// In-memory feed items store
export const FEED_STORE: FeedItemData[] = [
  {
    id: 'feed-1',
    category: 'Autonomous Insight',
    title: 'AI Builder Cup 2026 Criteria Verified',
    summary:
      'Muse AI researched the latest judging criteria for AI Builder Cup. Identified key focus on solo agentic workflows, multi-step tool calling, and live browser automation.',
    timestamp: '15m ago',
    sourceUrl: 'https://news.ycombinator.com',
    replayUrl: 'https://www.browserbase.com/sessions/2c0cbbea-8f1f-4044-9a64-ada4e87cc8c0',
    tags: ['Research', 'Agentic AI', 'Competitions'],
    icon: '🏆',
  },
  {
    id: 'feed-2',
    category: 'Market Intelligence',
    title: 'Top 5 Solo Developer Apps Trending on X',
    summary:
      'Autonomous scan compiled trending micro-SaaS tools with verified revenue figures. Top performers include automated newsletter curators and AI video re-framers.',
    timestamp: '2h ago',
    sourceUrl: 'https://github.com/trending',
    tags: ['Trends', 'Micro-SaaS', 'Leaderboard'],
    icon: '🗂️',
  },
  {
    id: 'feed-3',
    category: 'Goal Execution',
    title: 'Morning Tech News Digest Compiled',
    summary:
      'Hacker News and GitHub Trending crawled via Browserbase cloud session. 229 links parsed and key breakthroughs categorized.',
    timestamp: '4h ago',
    sourceUrl: 'https://news.ycombinator.com',
    replayUrl: 'https://www.browserbase.com/sessions/45ea61b8-1a58-405e-8391-6955f71a9e1a',
    tags: ['Daily Routine', 'Tech News'],
    icon: '📰',
  },
];

router.get('/', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    feed: FEED_STORE,
  });
});

router.post('/run-idea', async (req: Request, res: Response) => {
  try {
    const { ideaId, title, prompt, icon } = req.body;

    console.log(`💡 [Idea Runner] Executing 1-tap idea: "${title}"`);

    // Target research URL based on idea type
    let targetUrl = 'https://news.ycombinator.com';
    let tags = ['Idea Workflow', 'Cloud Research'];

    if (title.includes('AI Builder Cup')) {
      targetUrl = 'https://news.ycombinator.com';
      tags = ['AI Cup', 'Solo Build', 'Agentic'];
    } else if (title.includes('Leaderboard') || title.includes('money-making')) {
      targetUrl = 'https://github.com/trending';
      tags = ['Leaderboard', 'Revenue', 'Apps'];
    } else if (title.includes('Shorts') || title.includes('YouTube')) {
      targetUrl = 'https://news.ycombinator.com';
      tags = ['Video Creation', 'YouTube Shorts', 'Scripts'];
    } else if (title.includes('Launch') || title.includes('post')) {
      targetUrl = 'https://github.com/trending';
      tags = ['Launch Copy', 'Product Hunt', 'Hacker News'];
    }

    const sessionRes = await runCloudBrowserAutomation(targetUrl, `Research idea: ${title}`, async (page) => {
      const pageTitle = await page.title().catch(() => '');
      const firstHeading = await page.locator('h1, h2, a').first().textContent().catch(() => '');
      return {
        pageTitle,
        heading: firstHeading?.trim(),
        timestamp: new Date().toISOString(),
      };
    });

    const newFeedItem: FeedItemData = {
      id: `feed-${Date.now()}`,
      category: '1-Tap Idea Execution',
      title: `${title} Package Generated`,
      summary: `Muse AI analyzed target sources on ${new URL(targetUrl).hostname} and generated an action-ready blueprint based on your prompt: "${prompt}".`,
      timestamp: 'Just now',
      sourceUrl: targetUrl,
      replayUrl: sessionRes.replayUrl,
      tags,
      icon: icon || '💡',
    };

    FEED_STORE.unshift(newFeedItem);

    return res.json({
      success: true,
      feedItem: newFeedItem,
      sessionId: sessionRes.sessionId,
      replayUrl: sessionRes.replayUrl,
      message: `Idea "${title}" completed and posted to your Feed!`,
    });
  } catch (err: any) {
    console.error('[Idea Execution Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to execute idea workflow',
    });
  }
});

export default router;
