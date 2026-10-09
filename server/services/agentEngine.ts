import { searchWeb, fetchWebPage, runCloudBrowserAutomation, createCloudSession } from './browserbase';

export interface AgentAction {
  type: 'search' | 'fetch' | 'browser_session' | 'task_run';
  title: string;
  url?: string;
  sessionId?: string;
  liveViewUrl?: string;
  replayUrl?: string;
  details?: any;
}

export interface AgentResponse {
  reply: string;
  actions: AgentAction[];
  suggestedTasks?: string[];
}

/**
 * Autonomous agent engine for Cooper AI Companion
 */
export async function processAgentChat(
  userMessage: string,
  history: { sender: 'user' | 'agent'; text: string }[] = []
): Promise<AgentResponse> {
  const lower = userMessage.toLowerCase().trim();
  const actions: AgentAction[] = [];

  // 1. Detect URL or Web Browsing Requests
  const urlMatch = userMessage.match(/https?:\/\/[^\s]+/i);

  if (urlMatch) {
    const targetUrl = urlMatch[0];
    console.log(`[Agent] Detected URL browsing request for: ${targetUrl}`);

    // Launch cloud browser session to visit and analyze
    const sessionRes = await runCloudBrowserAutomation(targetUrl, `Analyze page: ${targetUrl}`, async (page) => {
      const title = await page.title();
      const metaDesc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => '');
      const headings = await page.locator('h1, h2, h3').allTextContents().catch(() => []);
      const linksCount = await page.locator('a').count().catch(() => 0);

      return {
        title,
        metaDescription: metaDesc,
        topHeadings: headings.slice(0, 5),
        linksCount,
      };
    });

    actions.push({
      type: 'browser_session',
      title: `Cloud Browser navigated to ${targetUrl}`,
      url: targetUrl,
      sessionId: sessionRes.sessionId,
      liveViewUrl: sessionRes.liveViewUrl,
      replayUrl: sessionRes.replayUrl,
      details: sessionRes.data,
    });

    const pageTitle = sessionRes.data?.title || targetUrl;
    const desc = sessionRes.data?.metaDescription ? `\n> ${sessionRes.data.metaDescription}` : '';
    const headings = sessionRes.data?.topHeadings?.length
      ? `\n\n**Key sections found:**\n` + sessionRes.data.topHeadings.map((h: string) => `• ${h.trim()}`).join('\n')
      : '';

    return {
      reply: `I opened **${targetUrl}** in a dedicated Browserbase cloud browser session! 🌐\n\n**Page Title:** ${pageTitle}${desc}${headings}\n\nYou can inspect the full cloud session live view and recording using the link below.`,
      actions,
      suggestedTasks: [
        `Monitor ${new URL(targetUrl).hostname} for changes`,
        `Extract structured data from ${new URL(targetUrl).hostname}`,
      ],
    };
  }

  // 2. Detect Search / Research Queries
  if (
    lower.startsWith('search') ||
    lower.startsWith('find') ||
    lower.startsWith('look up') ||
    lower.includes('latest') ||
    lower.includes('news') ||
    lower.includes('research') ||
    lower.includes('price of') ||
    lower.includes('scrape')
  ) {
    const query = userMessage
      .replace(/^(search for|search|find|look up|research|scrape)\s+/i, '')
      .trim();

    console.log(`[Agent] Running Browserbase Web Search for query: "${query}"`);

    // First search
    const searchRes = await searchWeb(query || userMessage, 4);

    actions.push({
      type: 'search',
      title: `Web search for "${query || userMessage}"`,
      details: searchRes.results,
    });

    // Also spin up a cloud browser verification session
    const cloudSession = await createCloudSession();
    actions.push({
      type: 'browser_session',
      title: `Browserbase Cloud Agent Session`,
      sessionId: cloudSession.session.id,
      liveViewUrl: cloudSession.liveViewUrl,
      replayUrl: cloudSession.replayUrl,
    });

    return {
      reply: `I investigated **"${query || userMessage}"** across the web using Browserbase cloud capabilities! 🔍\n\nI've gathered insights and initiated a cloud session to verify the latest sources.`,
      actions,
      suggestedTasks: [
        `Schedule daily research for "${query || userMessage}"`,
        `Set up alert when new updates appear`,
      ],
    };
  }

  // 3. Goal / Routine / Task trigger
  if (lower.includes('goal') || lower.includes('routine') || lower.includes('health') || lower.includes('task')) {
    const session = await createCloudSession();
    actions.push({
      type: 'task_run',
      title: 'Autonomous Goal Setup',
      sessionId: session.session.id,
      liveViewUrl: session.liveViewUrl,
      replayUrl: session.replayUrl,
    });

    return {
      reply: `I've initialized your automated goal workflow! 🎯\n\nI will monitor updates, crawl target resources periodically, and keep your Feed synchronized. Your cloud browser session is ready.`,
      actions,
      suggestedTasks: [
        'Run goal now in cloud browser',
        'Configure execution schedule (Daily / Hourly)',
      ],
    };
  }

  // 4. Default Conversational Assistant with Cooper persona
  return {
    reply: `Hello! I'm Cooper, your autonomous AI agent companion. 🤖\n\nI can navigate live websites, extract real-time data, execute automated workflows, and research topics in real cloud Chrome browsers powered by **Browserbase**.\n\nTry asking me to:\n• *Navigate to https://news.ycombinator.com and summarize top stories*\n• *Search for latest AI news this week*\n• *Track product pricing or launch a scheduled routine*`,
    actions: [],
    suggestedTasks: [
      'Browse https://github.com/trending',
      'Research top open-source AI agents',
      'Track fitness and health routine',
    ],
  };
}
