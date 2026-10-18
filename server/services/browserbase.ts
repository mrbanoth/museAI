import { Browserbase } from '@browserbasehq/sdk';
import { chromium } from 'playwright-core';
import dns from 'dns/promises';
import net from 'net';
import dotenv from 'dotenv';
import { Agent as UndiciAgent, fetch as undiciFetch } from 'undici';
import { step } from './events';
import { capturePage } from './screenshots';

dotenv.config();

const apiKey = process.env.BROWSERBASE_API_KEY;
const projectId = process.env.BROWSERBASE_PROJECT_ID || undefined;

export const bbClient = new Browserbase({
  apiKey: apiKey || '',
});

export const isBrowserbaseConfigured = () => !!apiKey;

export interface BrowserSessionResult {
  /** Browserbase session id; absent when the lightweight fetch path was used */
  sessionId?: string;
  /** Embeddable real-time view of the remote browser (only while the session is alive) */
  liveViewUrl?: string;
  /** Browserbase dashboard page holding the session recording */
  replayUrl?: string;
  /** Final page screenshot (/shots/<id>.jpg) */
  screenshotUrl?: string;
  /** 'browserbase' = real cloud Chrome, 'fetch' = plain HTTP fetch fallback */
  mode: 'browserbase' | 'fetch';
  status: 'COMPLETED' | 'FAILED';
  error?: string;
  data?: PageExtraction;
}

export interface PageExtraction {
  url: string;
  title: string;
  headings: string[];
  text: string;
  links: Array<{ text: string; href: string }>;
}

const MAX_TEXT = 6000;

// Every non-public range: private, loopback, link-local (cloud metadata), CGNAT, benchmark, multicast, reserved
const blocked = new net.BlockList();
for (const [range, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) {
  blocked.addSubnet(range, prefix, 'ipv4');
}
for (const [range, prefix] of [
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['100::', 64], ['2001:db8::', 32],
  ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
] as const) {
  blocked.addSubnet(range, prefix, 'ipv6');
}

/** IPv4-mapped / -compatible IPv6 (e.g. ::ffff:a9fe:a9fe) → the IPv4 address it reaches */
function embeddedIpv4(ip: string): string | null {
  const lower = ip.toLowerCase();
  const dotted = lower.match(/^(?:::ffff:|::)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return dotted[1];
  const hex = lower.match(/^(?:::ffff:|::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return null;
}

export function isPrivateIp(ip: string): boolean {
  const v4 = net.isIPv4(ip) ? ip : embeddedIpv4(ip);
  if (v4) return blocked.check(v4, 'ipv4');
  if (net.isIPv6(ip)) return blocked.check(ip, 'ipv6');
  return true;
}

/**
 * DNS lookup used for every outbound connection: refuses private addresses at connect
 * time, so a host can't pass the URL check and then re-resolve to an internal IP.
 */
function guardedLookup(hostname: string, options: any, callback: (...args: any[]) => void) {
  dns
    .lookup(hostname, { all: true })
    .then((addresses) => {
      const bad = addresses.find((a) => isPrivateIp(a.address));
      if (bad) {
        callback(new Error(`Refusing to connect to private address ${bad.address}`));
      } else if (options?.all) {
        callback(null, addresses);
      } else {
        callback(null, addresses[0].address, addresses[0].family);
      }
    })
    .catch((err) => callback(err));
}

const publicOnlyAgent = new UndiciAgent({ connect: { lookup: guardedLookup as any } });

/**
 * Rejects non-http(s) URLs and hosts that resolve to private/loopback addresses,
 * so the agent cannot be used to probe the server's own network.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid URL: ${raw}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Only http(s) URLs are allowed: ${raw}`);
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error(`Refusing to access local host: ${host}`);
  }
  let addresses: string[] = [host];
  if (!net.isIP(host)) {
    // Unresolvable hosts can't reach the private network either; the request itself will fail later
    addresses = await dns.lookup(host, { all: true }).then((r) => r.map((a) => a.address)).catch(() => []);
  }
  if (addresses.some(isPrivateIp)) {
    throw new Error(`Refusing to access private network address: ${host}`);
  }
  return url;
}

function htmlToText(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

const MAX_REDIRECTS = 5;

/**
 * fetch for agent-chosen URLs: every redirect hop is re-validated and every connection
 * goes through guardedLookup, so neither redirects nor DNS rebinding reach internal hosts.
 */
async function timedFetch(url: string, init: { headers?: Record<string, string> } = {}, timeoutMs = 15000) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current);
    const res = await undiciFetch(current, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ...(init.headers || {}),
      },
      redirect: 'manual',
      dispatcher: publicOnlyAgent,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return res;
  }
  throw new Error('Too many redirects');
}

/**
 * Fetches a page as readable text (Browserbase Fetch API, falling back to a direct fetch).
 */
export async function fetchWebPage(url: string): Promise<{ success: boolean; url: string; title?: string; content?: string; error?: string }> {
  try {
    await assertPublicUrl(url);
  } catch (e: any) {
    return { success: false, url, error: e.message };
  }

  if (apiKey) {
    try {
      const result = await bbClient.fetchAPI.create({ url, format: 'markdown' });
      if (typeof result?.content === 'string' && result.content.trim()) {
        return { success: true, url, content: result.content.slice(0, MAX_TEXT) };
      }
    } catch (e: any) {
      console.warn('[Browserbase Fetch] falling back to direct fetch:', e.message);
    }
  }

  try {
    const res = await timedFetch(url);
    if (!res.ok) return { success: false, url, error: `HTTP ${res.status}` };
    const html = await res.text();
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
    return { success: true, url, title, content: htmlToText(html).slice(0, MAX_TEXT) };
  } catch (error: any) {
    return { success: false, url, error: error.message };
  }
}

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
}

/**
 * Web search via Browserbase Search, falling back to DuckDuckGo's HTML endpoint.
 */
export async function searchWeb(query: string, numResults = 6): Promise<{ success: boolean; query: string; results: SearchResult[]; error?: string }> {
  if (apiKey) {
    try {
      const res = await bbClient.search.web({ query, numResults } as any);
      if (res?.results?.length) {
        return {
          success: true,
          query,
          results: res.results.slice(0, numResults).map((r) => ({
            title: r.title,
            url: r.url,
            publishedDate: r.publishedDate,
          })),
        };
      }
    } catch (e: any) {
      console.warn('[Browserbase Search] falling back to DuckDuckGo:', e.message);
    }
  }

  try {
    const res = await timedFetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
    const html = await res.text();
    const results: SearchResult[] = [];
    const blockRe = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>)?/g;
    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(html)) && results.length < numResults) {
      let href = m[1].replace(/&amp;/g, '&');
      const uddg = href.match(/[?&]uddg=([^&]+)/);
      if (uddg) href = decodeURIComponent(uddg[1]);
      if (href.startsWith('//')) href = `https:${href}`;
      if (!/^https?:/.test(href) || href.includes('duckduckgo.com/y.js')) continue;
      results.push({ title: htmlToText(m[2]), url: href, snippet: m[3] ? htmlToText(m[3]) : undefined });
    }
    return { success: results.length > 0, query, results, error: results.length ? undefined : 'No results found' };
  } catch (error: any) {
    return { success: false, query, results: [], error: error.message };
  }
}

// In-page extraction as plain JS source (tsx would inject helpers that don't exist in the browser)
const EXTRACT_SCRIPT = String.raw`function (maxText) {
  var clean = function (s) { return (s || '').replace(/\s+/g, ' ').trim(); };
  var headings = Array.prototype.slice.call(document.querySelectorAll('h1, h2, h3'))
    .map(function (h) { return clean(h.textContent); }).filter(Boolean).slice(0, 12);
  var links = Array.prototype.slice.call(document.querySelectorAll('a[href]'))
    .map(function (a) { return { text: clean(a.textContent), href: a.href }; })
    .filter(function (l) { return l.text.length > 3 && /^https?:/.test(l.href); }).slice(0, 25);
  var main = document.querySelector('main, article, [role="main"]') || document.body;
  return { url: location.href, title: document.title, headings: headings, text: clean(main.innerText).slice(0, maxText), links: links };
}`;

async function extractFromPage(page: any): Promise<PageExtraction> {
  return page.evaluate(`(${EXTRACT_SCRIPT})(${MAX_TEXT})`);
}

/**
 * Opens the URL in a real Browserbase cloud Chrome session, streams progress
 * (including the embeddable live view URL) as agent.step events, and extracts
 * page content. Falls back to a plain fetch when Browserbase is unavailable.
 */
export async function runCloudBrowserAutomation(
  url: string,
  goal: string,
  requestId?: string
): Promise<BrowserSessionResult> {
  try {
    await assertPublicUrl(url);
  } catch (e: any) {
    step(requestId, e.message, { phase: 'error' });
    return { mode: 'fetch', status: 'FAILED', error: e.message };
  }

  if (apiKey) {
    let sessionId: string | undefined;
    let liveViewUrl: string | undefined;
    let browser: any = null;
    try {
      step(requestId, 'Starting cloud browser...', { phase: 'session' });
      const session = await bbClient.sessions.create({ projectId, keepAlive: false } as any);
      sessionId = session.id;
      const replayUrl = `https://www.browserbase.com/sessions/${sessionId}`;

      try {
        const debug = await bbClient.sessions.debug(sessionId);
        liveViewUrl = debug.debuggerFullscreenUrl;
      } catch (e: any) {
        console.warn('[Browserbase] live view URL unavailable:', e.message);
      }

      step(requestId, `Navigating to ${new URL(url).hostname}...`, {
        phase: 'navigate',
        sessionId,
        liveViewUrl,
        replayUrl,
        url,
      });

      browser = await chromium.connectOverCDP(session.connectUrl);
      const context = browser.contexts()[0] || (await browser.newContext());
      const page = context.pages()[0] || (await context.newPage());
      page.setDefaultTimeout(15000);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

      step(requestId, `Reading page: ${goal}`, { phase: 'extract', sessionId });
      const data = await extractFromPage(page);
      const screenshotUrl = await capturePage(page);

      return { sessionId, liveViewUrl, replayUrl, screenshotUrl, mode: 'browserbase', status: 'COMPLETED', data };
    } catch (err: any) {
      console.warn('[Browserbase] session failed, falling back to fetch:', err.message);
      step(requestId, 'Cloud browser failed, trying direct fetch...', { phase: 'fallback' });
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }

  step(requestId, `Fetching ${url}...`, { phase: 'fetch', url });
  const page = await fetchWebPage(url);
  if (!page.success) {
    return { mode: 'fetch', status: 'FAILED', error: page.error };
  }
  return {
    mode: 'fetch',
    status: 'COMPLETED',
    data: {
      url,
      title: page.title || new URL(url).hostname,
      headings: [],
      text: page.content || '',
      links: [],
    },
  };
}
