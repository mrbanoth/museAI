import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { searchWeb, fetchWebPage, runCloudBrowserAutomation } from './browserbase';
import { step, emitEvent } from './events';
import { Store } from './store';
import { computeNextRun, isValidSchedule } from './schedule';

dotenv.config();

export interface AgentAction {
  type: 'search' | 'fetch' | 'browser_session' | 'task_created';
  title: string;
  url?: string;
  sessionId?: string;
  liveViewUrl?: string;
  replayUrl?: string;
  status?: 'COMPLETED' | 'FAILED';
  details?: any;
}

export interface AgentResponse {
  reply: string;
  actions: AgentAction[];
  suggestedTasks?: string[];
  /** Which brain produced the reply */
  engine: 'gemini' | 'basic';
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const MAX_TOOL_ROUNDS = 6;

export const isLlmConfigured = () => !!process.env.GEMINI_API_KEY;

const agentTools = [
  {
    functionDeclarations: [
      {
        name: 'browse_web_page',
        description:
          'Opens the URL in a real cloud Chrome browser (Browserbase) and returns the page title, headings, main text and links. Use for any page that needs JavaScript rendering or when the user wants to watch the browser.',
        parameters: {
          type: 'OBJECT',
          properties: {
            url: { type: 'STRING', description: 'Full http(s) URL to open.' },
            goal: { type: 'STRING', description: 'What to look for on the page.' },
          },
          required: ['url'],
        },
      },
      {
        name: 'search_web',
        description: 'Searches the web and returns result titles and URLs. Follow up with fetch_page_content or browse_web_page to read results.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Search query.' },
          },
          required: ['query'],
        },
      },
      {
        name: 'fetch_page_content',
        description: 'Fast text fetch of a page without a full browser. Prefer this for simple static pages and articles.',
        parameters: {
          type: 'OBJECT',
          properties: {
            url: { type: 'STRING', description: 'URL to fetch.' },
          },
          required: ['url'],
        },
      },
      {
        name: 'create_scheduled_task',
        description:
          'Creates a recurring background task that Muse runs automatically and posts results to the Feed. Only call when the user asks to track, monitor, schedule or repeat something.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Short task name.' },
            instructions: { type: 'STRING', description: 'What the agent should do on every run.' },
            schedule: {
              type: 'STRING',
              description:
                'One of: "Every N minutes", "Every N hours", "Every N days", "Daily at HH:MM", "Weekly on <Day> at HH:MM", "Manual".',
            },
            url: { type: 'STRING', description: 'Optional page to check on every run.' },
          },
          required: ['title', 'instructions', 'schedule'],
        },
      },
    ],
  },
];

const SYSTEM_INSTRUCTION = `You are Muse AI, an autonomous AI companion that gets real work done on the web.
Today is ${new Date().toDateString()}.
- Use tools whenever the answer depends on current or external information. Never invent facts, prices, links or results.
- You may chain several tool calls: search first, then read the most relevant pages.
- When the user asks to track, monitor or repeat something, create a scheduled task.
- Answer concisely with short bullet points, bold key facts, and cite source URLs you actually read.
- If a tool fails, say so plainly instead of pretending it worked.`;

function truncate(value: any, max = 4000) {
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/**
 * Executes a tool called by the LLM (or by the basic engine) and records it as a UI action.
 */
async function executeTool(name: string, args: any, actions: AgentAction[], requestId?: string): Promise<any> {
  console.log(`[Muse Tool] ${name}(${truncate(args, 200)})`);

  if (name === 'browse_web_page') {
    const { url, goal } = args;
    const res = await runCloudBrowserAutomation(url, goal || `Browse ${url}`, requestId);
    actions.push({
      type: res.mode === 'browserbase' ? 'browser_session' : 'fetch',
      title: res.data?.title || url,
      url,
      sessionId: res.sessionId,
      liveViewUrl: res.liveViewUrl,
      replayUrl: res.replayUrl,
      status: res.status,
      details: res.data ? { headings: res.data.headings } : { error: res.error },
    });
    if (res.status === 'FAILED') return { error: res.error || 'Failed to open page' };
    return {
      title: res.data?.title,
      headings: res.data?.headings,
      text: truncate(res.data?.text, 5000),
      links: res.data?.links?.slice(0, 15),
    };
  }

  if (name === 'search_web') {
    const { query } = args;
    step(requestId, `Searching the web for "${query}"...`, { phase: 'search' });
    const res = await searchWeb(query, 6);
    actions.push({
      type: 'search',
      title: `Search: "${query}"`,
      status: res.success ? 'COMPLETED' : 'FAILED',
      details: res.results,
    });
    return res.success ? { results: res.results } : { error: res.error || 'Search failed' };
  }

  if (name === 'fetch_page_content') {
    const { url } = args;
    step(requestId, `Reading ${url}...`, { phase: 'fetch', url });
    const res = await fetchWebPage(url);
    actions.push({
      type: 'fetch',
      title: res.title || url,
      url,
      status: res.success ? 'COMPLETED' : 'FAILED',
    });
    return res.success ? { title: res.title, content: truncate(res.content, 5000) } : { error: res.error };
  }

  if (name === 'create_scheduled_task') {
    const { title, instructions, url } = args;
    const schedule = isValidSchedule(args.schedule || '') ? args.schedule : 'Daily at 9:00';
    const task = Store.createTask({
      title,
      subtitle: instructions,
      url,
      schedule,
      category: 'tracking',
      nextRunAt: computeNextRun(schedule)?.toISOString(),
    });
    emitEvent('task.updated', task);
    actions.push({ type: 'task_created', title: `Scheduled: ${title} (${schedule})`, details: { taskId: task.id } });
    return { created: true, taskId: task.id, schedule, nextRunAt: task.nextRunAt };
  }

  return { error: `Unknown tool: ${name}` };
}

async function runGemini(
  userMessage: string,
  history: { sender: string; text: string }[],
  actions: AgentAction[],
  requestId?: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const contents: any[] = history
    .filter((h) => h.text && (h.sender === 'user' || h.sender === 'agent'))
    .slice(-10)
    .map((h) => ({ role: h.sender === 'user' ? 'user' : 'model', parts: [{ text: h.text }] }));
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    step(requestId, round === 0 ? 'Thinking...' : 'Analyzing results...', { phase: 'think' });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: agentTools as any,
        temperature: 0.5,
      },
    });

    const calls = response.functionCalls || [];
    if (calls.length === 0) {
      return response.text || 'Done.';
    }

    contents.push(response.candidates?.[0]?.content || { role: 'model', parts: calls.map((fc) => ({ functionCall: fc })) });

    const parts = [];
    for (const call of calls) {
      if (!call.name) continue;
      let result: any;
      try {
        result = await executeTool(call.name, call.args || {}, actions, requestId);
      } catch (e: any) {
        result = { error: e.message };
      }
      parts.push({ functionResponse: { id: call.id, name: call.name, response: result } });
    }
    contents.push({ role: 'user', parts });
  }

  // Tool budget exhausted: ask for a final answer without tools
  const final = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.5 },
  });
  return final.text || 'I gathered the information above but could not finish the summary.';
}

/**
 * Keyword-driven engine used when no LLM key is configured. It still runs the real
 * tools and reports their actual output, but cannot reason over it.
 */
async function runBasic(userMessage: string, actions: AgentAction[], requestId?: string): Promise<string> {
  const notice = '_AI reasoning is offline (GEMINI_API_KEY not set) — showing raw results._\n\n';
  const urlMatch = userMessage.match(/https?:\/\/[^\s)]+/i);

  if (urlMatch) {
    const result = await executeTool('browse_web_page', { url: urlMatch[0] }, actions, requestId);
    if (result.error) return `${notice}I couldn't open **${urlMatch[0]}**: ${result.error}`;
    const headings = (result.headings || []).slice(0, 8).map((h: string) => `• ${h}`).join('\n');
    return `${notice}**${result.title || urlMatch[0]}**\n\n${headings || truncate(result.text, 800)}`;
  }

  const query = userMessage.replace(/^(please\s+)?(search( for)?|find|look up|research)\s+/i, '').trim();
  const result = await executeTool('search_web', { query }, actions, requestId);
  if (result.error || !result.results?.length) {
    return `${notice}Search for **"${query}"** returned nothing${result.error ? ` (${result.error})` : ''}.`;
  }
  const lines = result.results.map((r: any) => `• **${r.title}**\n  ${r.url}${r.snippet ? `\n  ${r.snippet}` : ''}`);
  return `${notice}Top results for **"${query}"**:\n\n${lines.join('\n')}`;
}

/**
 * Runs one agent turn: reasoning + tool use, streaming progress as agent.step events.
 */
export async function processAgentChat(
  userMessage: string,
  history: { sender: string; text: string }[] = [],
  requestId?: string
): Promise<AgentResponse> {
  const actions: AgentAction[] = [];

  if (isLlmConfigured()) {
    const reply = await runGemini(userMessage, history, actions, requestId);
    const scheduled = actions.some((a) => a.type === 'task_created');
    return {
      reply,
      actions,
      engine: 'gemini',
      suggestedTasks: actions.length && !scheduled ? ['Track this daily'] : undefined,
    };
  }

  const reply = await runBasic(userMessage, actions, requestId);
  return { reply, actions, engine: 'basic' };
}
