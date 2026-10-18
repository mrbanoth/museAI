import crypto from 'crypto';
import dotenv from 'dotenv';
import { Store, ConnectionRecord } from './store';

dotenv.config();

/**
 * Google OAuth + Gmail / Calendar REST helpers (no SDK, plain fetch).
 */

export type GoogleService = 'gmail' | 'gcal';

const SERVICES: Record<GoogleService, { name: string; scopes: string[] }> = {
  gmail: {
    name: 'Gmail',
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  },
  gcal: {
    name: 'Google Calendar',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  },
};

const BASE_SCOPES = ['openid', 'email'];
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const STATE_TTL_MS = 10 * 60_000;

const clientId = () => process.env.GOOGLE_CLIENT_ID || '';
const clientSecret = () => process.env.GOOGLE_CLIENT_SECRET || '';
const redirectUri = () =>
  process.env.GOOGLE_REDIRECT_URI || `http://localhost:${process.env.PORT || 3001}/api/connectors/google/callback`;

export const isGoogleConfigured = () => !!clientId() && !!clientSecret();

export const isGoogleService = (id: string): id is GoogleService => id === 'gmail' || id === 'gcal';

export function isConnected(service: GoogleService) {
  return !!Store.getConnection(service);
}

export function connectionStatus() {
  return (Object.keys(SERVICES) as GoogleService[]).map((id) => {
    const conn = Store.getConnection(id);
    return {
      id,
      name: SERVICES[id].name,
      available: isGoogleConfigured(),
      connected: !!conn,
      email: conn?.email,
      connectedAt: conn?.connectedAt,
    };
  });
}

// ---------------------------------------------------------------------------
// OAuth flow
// ---------------------------------------------------------------------------

const pendingStates = new Map<string, { service: GoogleService; returnTo?: string; createdAt: number }>();

/**
 * Only redirect back to the app itself: its deep-link scheme, Expo Go, or an allowed web origin.
 */
function isAllowedReturnUrl(raw?: string): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    if (['museaiclone:', 'exp:', 'exps:'].includes(url.protocol)) return true;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
    const allowed = [process.env.APP_URL, ...(process.env.CORS_ORIGINS?.split(',') || [])]
      .map((o) => o?.trim())
      .filter(Boolean);
    return allowed.includes(url.origin);
  } catch {
    return false;
  }
}

export function buildAuthUrl(service: GoogleService, returnTo?: string) {
  if (!isGoogleConfigured()) {
    throw new Error('Google connectors are not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.');
  }
  const now = Date.now();
  for (const [key, value] of pendingStates) {
    if (now - value.createdAt > STATE_TTL_MS) pendingStates.delete(key);
  }

  const state = crypto.randomBytes(24).toString('hex');
  pendingStates.set(state, {
    service,
    returnTo: isAllowedReturnUrl(returnTo) ? returnTo : undefined,
    createdAt: now,
  });

  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: [...BASE_SCOPES, ...SERVICES[service].scopes].join(' '),
    access_type: 'offline',
    // Always ask so Google returns a refresh token even on re-connect
    prompt: 'consent',
    state,
  });
  return `${AUTH_URL}?${params}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId(), client_secret: clientSecret(), ...body }),
    signal: AbortSignal.timeout(15000),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data.error_description || data.error || `Token request failed (${res.status})`);
    err.code = data.error;
    throw err;
  }
  return data as { access_token: string; refresh_token?: string; expires_in: number; scope: string };
}

/**
 * Completes the OAuth callback: exchanges the code, stores tokens, returns where to send the user.
 */
export async function handleCallback(code: string, state: string) {
  const pending = pendingStates.get(state);
  pendingStates.delete(state);
  if (!pending || Date.now() - pending.createdAt > STATE_TTL_MS) {
    throw new Error('This sign-in link expired. Please try connecting again.');
  }

  const tokens = await tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: redirectUri() });
  const granted = tokens.scope.split(' ');
  const missing = SERVICES[pending.service].scopes.filter((s) => !granted.includes(s));
  if (missing.length) {
    throw new Error(`${SERVICES[pending.service].name} access was not granted. Please allow all requested permissions.`);
  }

  let email: string | undefined;
  try {
    const info = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    email = ((await info.json()) as any).email;
  } catch {}

  const record: ConnectionRecord = {
    id: pending.service,
    email,
    scopes: granted,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || Store.getConnection(pending.service)?.refreshToken,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    connectedAt: new Date().toISOString(),
  };
  Store.saveConnection(record);
  return { service: pending.service, name: SERVICES[pending.service].name, email, returnTo: pending.returnTo };
}

export async function disconnect(service: GoogleService) {
  const conn = Store.getConnection(service);
  if (!conn) return false;
  // Best effort: revoke on Google's side too
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(conn.refreshToken || conn.accessToken)}`, {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
  }).catch(() => {});
  return Store.deleteConnection(service);
}

async function getAccessToken(service: GoogleService): Promise<string> {
  const conn = Store.getConnection(service);
  if (!conn) throw new Error(`${SERVICES[service].name} is not connected. Connect it in Settings → Connectors.`);
  if (conn.expiresAt - Date.now() > 60_000) return conn.accessToken;
  if (!conn.refreshToken) {
    Store.deleteConnection(service);
    throw new Error(`${SERVICES[service].name} session expired. Please reconnect it in Settings.`);
  }
  try {
    const tokens = await tokenRequest({ refresh_token: conn.refreshToken, grant_type: 'refresh_token' });
    Store.saveConnection({ ...conn, accessToken: tokens.access_token, expiresAt: Date.now() + tokens.expires_in * 1000 });
    return tokens.access_token;
  } catch (e: any) {
    if (e.code === 'invalid_grant') {
      // User revoked access from their Google account
      Store.deleteConnection(service);
      throw new Error(`${SERVICES[service].name} access was revoked. Please reconnect it in Settings.`);
    }
    throw e;
  }
}

async function googleApi(service: GoogleService, url: string, init: RequestInit = {}) {
  const token = await getAccessToken(service);
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    signal: AbortSignal.timeout(20000),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Google API error (${res.status})`);
  return data;
}

// ---------------------------------------------------------------------------
// Gmail
// ---------------------------------------------------------------------------

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';

const header = (headers: any[] = [], name: string) =>
  headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

export async function gmailSearch(query: string, maxResults = 10) {
  const list = await googleApi(
    'gmail',
    `${GMAIL}/messages?${new URLSearchParams({ q: query || 'in:inbox', maxResults: String(Math.min(maxResults, 25)) })}`
  );
  const ids: string[] = (list.messages || []).map((m: any) => m.id);
  const messages = await Promise.all(
    ids.map((id) =>
      googleApi(
        'gmail',
        `${GMAIL}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`
      )
    )
  );
  return messages.map((m: any) => ({
    id: m.id,
    subject: header(m.payload?.headers, 'Subject'),
    from: header(m.payload?.headers, 'From'),
    date: header(m.payload?.headers, 'Date'),
    snippet: m.snippet,
    unread: (m.labelIds || []).includes('UNREAD'),
  }));
}

function extractBody(part: any): string {
  if (!part) return '';
  if (part.mimeType === 'text/plain' && part.body?.data) {
    return Buffer.from(part.body.data, 'base64url').toString('utf8');
  }
  for (const child of part.parts || []) {
    const text = extractBody(child);
    if (text) return text;
  }
  if (part.mimeType === 'text/html' && part.body?.data) {
    return Buffer.from(part.body.data, 'base64url')
      .toString('utf8')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
  }
  return '';
}

export async function gmailRead(id: string) {
  const m = await googleApi('gmail', `${GMAIL}/messages/${encodeURIComponent(id)}?format=full`);
  return {
    id: m.id,
    subject: header(m.payload?.headers, 'Subject'),
    from: header(m.payload?.headers, 'From'),
    to: header(m.payload?.headers, 'To'),
    date: header(m.payload?.headers, 'Date'),
    body: extractBody(m.payload).trim().slice(0, 6000),
  };
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

const CAL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

const mapEvent = (e: any) => ({
  id: e.id,
  summary: e.summary || '(no title)',
  start: e.start?.dateTime || e.start?.date,
  end: e.end?.dateTime || e.end?.date,
  location: e.location,
  link: e.htmlLink,
});

export async function calendarList(daysAhead = 7, maxResults = 20) {
  const now = new Date();
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: new Date(now.getTime() + Math.min(daysAhead, 90) * 86400_000).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(Math.min(maxResults, 50)),
  });
  const data = await googleApi('gcal', `${CAL}?${params}`);
  return (data.items || []).map(mapEvent);
}

export async function calendarCreate(input: {
  summary: string;
  start: string;
  end?: string;
  description?: string;
  location?: string;
}) {
  const start = new Date(input.start);
  if (Number.isNaN(start.getTime())) throw new Error(`Invalid start time: ${input.start}`);
  const end = input.end ? new Date(input.end) : new Date(start.getTime() + 3600_000);
  if (Number.isNaN(end.getTime()) || end <= start) throw new Error('End time must be after start time');

  const timeZone = process.env.GOOGLE_CALENDAR_TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const event = await googleApi('gcal', CAL, {
    method: 'POST',
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: start.toISOString(), timeZone },
      end: { dateTime: end.toISOString(), timeZone },
    }),
  });
  return mapEvent(event);
}
