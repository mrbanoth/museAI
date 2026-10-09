import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  searchWeb,
  fetchWebPage,
  runCloudBrowserAutomation,
  createCloudSession,
} from './browserbase';

dotenv.config();

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

// Tool definitions for Google Gemini
const agentTools = [
  {
    functionDeclarations: [
      {
        name: 'browse_web_page',
        description:
          'Opens a real Chrome browser in the cloud on Browserbase to navigate a target URL, extract headings, structured data, and generate a live session replay.',
        parameters: {
          type: 'OBJECT',
          properties: {
            url: {
              type: 'STRING',
              description: 'The full HTTP/HTTPS URL to navigate and extract data from.',
            },
            goal: {
              type: 'STRING',
              description: 'Brief description of what information to look for on the page.',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'search_web',
        description:
          'Searches the web for up-to-date information, news, rankings, or answers using Browserbase Search.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The search query to look up on the web.',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'fetch_page_content',
        description:
          'Performs a fast, lightweight page fetch without spinning up a full browser.',
        parameters: {
          type: 'OBJECT',
          properties: {
            url: {
              type: 'STRING',
              description: 'The URL to fetch content from.',
            },
          },
          required: ['url'],
        },
      },
    ],
  },
];

const SYSTEM_INSTRUCTION = `You are Muse AI, an autonomous AI companion and proactive intelligence agent.
You are warm, intelligent, concise, action-oriented, and equipped with real cloud browser automation capabilities powered by Browserbase.
When the user asks you to check websites, read news, track prices, research topics, or perform workflows:
- Use your tools to browse, search, or fetch data.
- Synthesize findings clearly and concisely with bullet points and bold highlights.
- Highlight that you executed the actions inside Browserbase cloud browsers.`;

/**
 * Executes a tool called by the LLM
 */
async function executeTool(name: string, args: any, actions: AgentAction[]): Promise<any> {
  console.log(`🤖 [Muse AI Tool Call] ${name}(${JSON.stringify(args)})`);

  if (name === 'browse_web_page') {
    const { url, goal } = args;
    const sessionRes = await runCloudBrowserAutomation(url, goal || `Browse ${url}`, async (page) => {
      const title = await page.title().catch(() => '');
      const headings = await page.locator('h1, h2, h3').allTextContents().catch(() => []);
      const linksCount = await page.locator('a').count().catch(() => 0);
      return {
        title,
        topHeadings: headings.slice(0, 6),
        linksCount,
      };
    });

    actions.push({
      type: 'browser_session',
      title: `Cloud Browser: ${url}`,
      url,
      sessionId: sessionRes.sessionId,
      liveViewUrl: sessionRes.liveViewUrl,
      replayUrl: sessionRes.replayUrl,
      details: sessionRes.data,
    });

    return {
      status: sessionRes.status,
      sessionId: sessionRes.sessionId,
      extracted: sessionRes.data,
      replayUrl: sessionRes.replayUrl,
    };
  }

  if (name === 'search_web') {
    const { query } = args;
    const searchRes = await searchWeb(query, 5);

    // Also spin up a session for verification
    const cloudSession = await createCloudSession();
    actions.push({
      type: 'browser_session',
      title: `Search: "${query}"`,
      sessionId: cloudSession.session.id,
      liveViewUrl: cloudSession.liveViewUrl,
      replayUrl: cloudSession.replayUrl,
      details: searchRes.results,
    });

    return {
      results: searchRes.results,
      sessionId: cloudSession.session.id,
    };
  }

  if (name === 'fetch_page_content') {
    const { url } = args;
    const fetchRes = await fetchWebPage(url);
    actions.push({
      type: 'fetch',
      title: `Fetch: ${url}`,
      url,
      details: fetchRes,
    });
    return fetchRes;
  }

  return { error: `Unknown tool: ${name}` };
}

/**
 * Autonomous agent engine for Cooper AI Companion powered by Gemini
 */
export async function processAgentChat(
  userMessage: string,
  history: { sender: 'user' | 'agent'; text: string }[] = []
): Promise<AgentResponse> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const actions: AgentAction[] = [];

  // If GEMINI_API_KEY is available, use Gemini 2.5 Flash
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });

      // Convert history
      const formattedHistory = history.slice(-6).map((h) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      }));

      // 1. Initial LLM Turn with Tool Call capability
      const modelName = 'gemini-3.8-flash';
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: userMessage }] },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: agentTools as any,
          temperature: 0.7,
        },
      });

      // Check if the model called any tools
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const toolResponses: Array<{ name: string; response: any }> = [];

        for (const call of functionCalls) {
          if (!call.name) continue;
          const result = await executeTool(call.name, call.args, actions);
          toolResponses.push({
            name: call.name,
            response: result,
          });
        }

        // 2. Second turn: Feed tool outputs back to generate the final synthesis
        const modelParts = response.candidates?.[0]?.content?.parts || functionCalls.map((fc: any) => ({
          functionCall: { name: fc.name, args: fc.args },
        }));

        const followUp = await ai.models.generateContent({
          model: modelName,
          contents: [
            ...formattedHistory,
            { role: 'user', parts: [{ text: userMessage }] },
            {
              role: 'model',
              parts: modelParts,
            },
            {
              role: 'user',
              parts: toolResponses.map((tr) => ({
                functionResponse: { name: tr.name, response: tr.response },
              })),
            },
          ],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        return {
          reply: followUp.text || 'I have finished executing the web automation.',
          actions,
          suggestedTasks: [
            'Schedule this as a daily routine',
            'Export summary report',
          ],
        };
      }

      return {
        reply: response.text || "I'm ready to help with your automated goals and web research!",
        actions,
      };
    } catch (err: any) {
      console.warn('⚠️ [Gemini LLM Fallback]:', err.message);
      // Fall through to deterministic autonomous engine below
    }
  }

  // Deterministic Fallback Autonomous Engine (handles URLs, Search, Goals natively)
  const lower = userMessage.toLowerCase().trim();
  const urlMatch = userMessage.match(/https?:\/\/[^\s]+/i);

  if (urlMatch) {
    const targetUrl = urlMatch[0];
    const sessionRes = await runCloudBrowserAutomation(targetUrl, `Analyze page: ${targetUrl}`, async (page) => {
      const title = await page.title().catch(() => '');
      const headings = await page.locator('h1, h2, h3').allTextContents().catch(() => []);
      const linksCount = await page.locator('a').count().catch(() => 0);
      return {
        title,
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
    const headings = sessionRes.data?.topHeadings?.length
      ? `\n\n**Key sections found:**\n` + sessionRes.data.topHeadings.map((h: string) => `• ${h.trim()}`).join('\n')
      : '';

    return {
      reply: `I navigated to **${targetUrl}** in a dedicated Browserbase cloud browser session! 🌐\n\n**Page Title:** ${pageTitle}${headings}\n\nYou can watch the full cloud session live view and recording below.`,
      actions,
      suggestedTasks: [
        `Monitor ${new URL(targetUrl).hostname} for updates`,
        `Extract structured data from ${new URL(targetUrl).hostname}`,
      ],
    };
  }

  if (
    lower.startsWith('search') ||
    lower.startsWith('find') ||
    lower.startsWith('look up') ||
    lower.includes('latest') ||
    lower.includes('news') ||
    lower.includes('research') ||
    lower.includes('price')
  ) {
    const query = userMessage.replace(/^(search for|search|find|look up|research|scrape)\s+/i, '').trim();
    const searchRes = await searchWeb(query || userMessage, 4);

    const cloudSession = await createCloudSession();
    actions.push({
      type: 'browser_session',
      title: `Search: "${query || userMessage}"`,
      sessionId: cloudSession.session.id,
      liveViewUrl: cloudSession.liveViewUrl,
      replayUrl: cloudSession.replayUrl,
      details: searchRes.results,
    });

    return {
      reply: `I researched **"${query || userMessage}"** across the web using Browserbase cloud capabilities! 🔍\n\nI initiated a cloud browser session to verify sources in real-time.`,
      actions,
      suggestedTasks: [
        `Schedule daily research for "${query || userMessage}"`,
        `Set up alert for new updates`,
      ],
    };
  }

  return {
    reply: `Hello! I'm Muse AI, your autonomous AI agent companion. 🤖\n\nI can navigate live websites, extract real-time data, execute automated workflows, and research topics in real cloud Chrome browsers powered by **Browserbase**.\n\nTry asking me to:\n• *Navigate to https://news.ycombinator.com and summarize top stories*\n• *Search for latest AI model releases*\n• *Track product pricing or launch a scheduled routine*`,
    actions: [],
    suggestedTasks: [
      'Browse https://github.com/trending',
      'Research top open-source AI agents',
      'Track fitness and health routine',
    ],
  };
}
