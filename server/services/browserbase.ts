import { Browserbase } from '@browserbasehq/sdk';
import { chromium } from 'playwright-core';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.BROWSERBASE_API_KEY;

if (!apiKey) {
  console.warn('⚠️ [Browserbase] BROWSERBASE_API_KEY is not set in environment or .env');
}

export const bbClient = new Browserbase({
  apiKey: apiKey || '',
});

export interface BrowserSessionResult {
  sessionId: string;
  liveViewUrl: string;
  replayUrl: string;
  status: string;
  data?: any;
}

/**
 * Creates a new cloud browser session on Browserbase
 */
export async function createCloudSession(options: { projectId?: string; keepAlive?: boolean } = {}) {
  const session = await bbClient.sessions.create({
    projectId: options.projectId,
    keepAlive: options.keepAlive ?? false,
  });

  const liveViewUrl = `https://www.browserbase.com/sessions/${session.id}`;
  const replayUrl = `https://www.browserbase.com/sessions/${session.id}`;

  return {
    session,
    liveViewUrl,
    replayUrl,
  };
}

/**
 * List recent Browserbase sessions
 */
export async function listRecentSessions(limit = 10) {
  try {
    const sessions = await bbClient.sessions.list({ status: 'RUNNING' });
    const allSessions = await bbClient.sessions.list();
    return allSessions.slice(0, limit);
  } catch (error: any) {
    console.error('Failed to list sessions:', error.message);
    return [];
  }
}

/**
 * Fetch page content directly via Browserbase Fetch API (fast, lightweight, no browser spin-up needed)
 */
export async function fetchWebPage(url: string) {
  try {
    const result = await bbClient.fetchAPI.create({
      url,
    });
    return {
      success: true,
      url,
      content: result.content,
    };
  } catch (error: any) {
    console.error(`[Browserbase Fetch] Error fetching ${url}:`, error.message);
    return {
      success: false,
      url,
      error: error.message,
    };
  }
}

/**
 * Search the web using Browserbase Search API
 */
export async function searchWeb(query: string, numResults = 5) {
  try {
    const results = await (bbClient.search as any).web({
      query,
      numResults,
    });
    return {
      success: true,
      query,
      results,
    };
  } catch (error: any) {
    console.error(`[Browserbase Search] Error searching "${query}":`, error.message);
    return {
      success: false,
      query,
      error: error.message,
      results: [],
    };
  }
}

/**
 * Runs a deterministic browser automation in the cloud via CDP + Playwright
 */
export async function runCloudBrowserAutomation(
  url: string,
  taskDescription: string,
  actions?: (page: any) => Promise<any>
): Promise<BrowserSessionResult> {
  const session = await bbClient.sessions.create({});
  const sessionId = session.id;
  const liveViewUrl = `https://www.browserbase.com/sessions/${sessionId}`;
  const replayUrl = `https://www.browserbase.com/sessions/${sessionId}`;

  console.log(`🚀 [Browserbase] Cloud browser session started: ${sessionId}`);
  console.log(`📺 [Live View] ${liveViewUrl}`);

  let customData: any = null;
  let browser: any = null;

  try {
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0] || (await browser.newContext());
    const page = context.pages()[0] || (await context.newPage());
    page.setDefaultTimeout(15000);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });

    if (actions) {
      customData = await actions(page);
    } else {
      // Default: extract title, heading, and meta description
      const title = await page.title().catch(() => '');
      const heading = await page.locator('h1, h2').first().textContent().catch(() => '');
      customData = {
        title,
        heading: heading?.trim() || '',
        url: page.url(),
      };
    }

    return {
      sessionId,
      liveViewUrl,
      replayUrl,
      status: 'COMPLETED',
      data: customData,
    };
  } catch (err: any) {
    console.error(`❌ [Browserbase] Session ${sessionId} automation failed:`, err.message);
    return {
      sessionId,
      liveViewUrl,
      replayUrl,
      status: 'FAILED',
      data: { error: err.message },
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
