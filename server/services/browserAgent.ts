import { chromium } from 'playwright-core';
import { bbClient, isBrowserbaseConfigured, assertPublicUrl } from './browserbase';
import { step } from './events';

/**
 * Interactive browser for the agent: one session per agent turn (keyed by requestId).
 * The model sees the page as a numbered list of interactive elements and acts on them
 * by number, while the user watches the Browserbase live view.
 */

const projectId = process.env.BROWSERBASE_PROJECT_ID || undefined;
const MAX_ELEMENTS = 80;
const MAX_TEXT = 3500;
const IDLE_CLOSE_MS = 5 * 60_000;

/*
 * Runs inside the page. Kept as plain JS source: tsx/esbuild would otherwise inject
 * helpers (e.g. __name) into the function that don't exist in the browser.
 */
const SNAPSHOT_SCRIPT = String.raw`function (maxElements, maxText) {
  var clean = function (s) { return (s || '').replace(/\s+/g, ' ').trim(); };
  document.querySelectorAll('[data-muse-id]').forEach(function (el) { el.removeAttribute('data-muse-id'); });
  var isVisible = function (el) {
    var r = el.getBoundingClientRect();
    var style = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' &&
      r.bottom > 0 && r.top < window.innerHeight * 2.5;
  };
  var selector = 'a[href], button, input:not([type=hidden]), textarea, select, [role=button], [role=link], [role=tab], [role=menuitem], [role=checkbox], [role=option], [contenteditable=true]';
  var elements = [];
  var id = 0;
  var nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
  for (var i = 0; i < nodes.length && id < maxElements; i++) {
    var el = nodes[i];
    if (!isVisible(el)) continue;
    var tag = el.tagName.toLowerCase();
    var label = clean(el.getAttribute('aria-label') || el.innerText || el.placeholder || el.getAttribute('title') || el.getAttribute('alt') || el.name).slice(0, 80);
    if (!label && tag === 'a') continue;
    id += 1;
    el.setAttribute('data-muse-id', String(id));
    var desc = '[' + id + '] ' + tag;
    if (tag === 'input') desc += '(' + (el.type || 'text') + ')';
    if (label) desc += ' "' + label + '"';
    if ((tag === 'input' || tag === 'textarea') && el.value && el.type !== 'password') {
      desc += ' value="' + clean(el.value).slice(0, 40) + '"';
    }
    if (tag === 'select') {
      var opts = Array.prototype.slice.call(el.options, 0, 8).map(function (o) { return clean(o.text); });
      desc += ' options=[' + opts.join(' | ') + ']';
    }
    elements.push(desc);
  }
  var main = document.querySelector('main, article, [role="main"]') || document.body;
  return { url: location.href, title: document.title, elements: elements, text: clean(main.innerText).slice(0, maxText) };
}`;

export interface PageSnapshot {
  url: string;
  title: string;
  elements: string[];
  text: string;
}

export class BrowserSession {
  sessionId?: string;
  liveViewUrl?: string;
  replayUrl?: string;
  private browser: any;
  page: any;
  private idleTimer?: ReturnType<typeof setTimeout>;

  constructor(private requestId?: string) {}

  static isAvailable() {
    return isBrowserbaseConfigured() || !!process.env.LOCAL_CHROMIUM_PATH;
  }

  async start() {
    if (isBrowserbaseConfigured()) {
      const session = await bbClient.sessions.create({ projectId, keepAlive: false } as any);
      this.sessionId = session.id;
      this.replayUrl = `https://www.browserbase.com/sessions/${session.id}`;
      this.liveViewUrl = (await bbClient.sessions.debug(session.id).catch(() => null))?.debuggerFullscreenUrl;
      this.browser = await chromium.connectOverCDP(session.connectUrl);
    } else if (process.env.LOCAL_CHROMIUM_PATH) {
      // Development only: a local headless Chrome (no live view)
      this.browser = await chromium.launch({ executablePath: process.env.LOCAL_CHROMIUM_PATH });
    } else {
      throw new Error('Interactive browsing needs BROWSERBASE_API_KEY on the server.');
    }
    const context = this.browser.contexts()[0] || (await this.browser.newContext({ viewport: { width: 1280, height: 800 } }));
    this.page = context.pages()[0] || (await context.newPage());
    this.page.setDefaultTimeout(15000);
    this.touch();
  }

  private touch() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.close(), IDLE_CLOSE_MS);
  }

  async close() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    await this.browser?.close().catch(() => {});
    this.browser = null;
  }

  private async settle() {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
  }

  async goto(url: string) {
    await assertPublicUrl(url);
    step(this.requestId, `Opening ${new URL(url).hostname}...`, {
      phase: 'navigate',
      url,
      sessionId: this.sessionId,
      liveViewUrl: this.liveViewUrl,
      replayUrl: this.replayUrl,
    });
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.settle();
    return this.snapshot();
  }

  /** Numbers visible interactive elements (data-muse-id) and returns a compact page description */
  async snapshot(): Promise<PageSnapshot> {
    this.touch();
    return this.page.evaluate(`(${SNAPSHOT_SCRIPT})(${MAX_ELEMENTS}, ${MAX_TEXT})`);
  }

  private locate(elementId: number) {
    return this.page.locator(`[data-muse-id="${Number(elementId)}"]`).first();
  }

  async click(elementId: number) {
    const el = this.locate(elementId);
    const label = ((await el.innerText().catch(() => '')) || '').trim().slice(0, 40);
    step(this.requestId, `Clicking ${label ? `"${label}"` : `element ${elementId}`}...`, { phase: 'act' });
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.click({ timeout: 10000 });
    await this.settle();
    return this.snapshot();
  }

  async type(elementId: number, text: string, pressEnter = false) {
    step(this.requestId, `Typing "${text.slice(0, 40)}"...`, { phase: 'act' });
    const el = this.locate(elementId);
    const tag: string = await el.evaluate((n: Element) => n.tagName.toLowerCase());
    if (tag === 'select') {
      await el.selectOption({ label: text }).catch(() => el.selectOption(text));
    } else {
      await el.fill(text, { timeout: 10000 });
      if (pressEnter) await el.press('Enter');
    }
    await this.settle();
    return this.snapshot();
  }

  async scroll(direction: 'down' | 'up') {
    step(this.requestId, `Scrolling ${direction}...`, { phase: 'act' });
    await this.page.mouse.wheel(0, direction === 'up' ? -700 : 700);
    await this.page.waitForTimeout(600);
    return this.snapshot();
  }

  async back() {
    step(this.requestId, 'Going back...', { phase: 'act' });
    await this.page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await this.settle();
    return this.snapshot();
  }
}

/** Formats a snapshot for the model */
export function describeSnapshot(s: PageSnapshot) {
  return {
    url: s.url,
    title: s.title,
    interactive_elements: s.elements.join('\n') || '(none visible — try scrolling)',
    visible_text: s.text,
  };
}
