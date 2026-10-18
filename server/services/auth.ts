import { NextFunction, Request, Response } from 'express';
import { runAsUser, LOCAL_USER } from './userContext';

/**
 * API access control. Every request runs as the verified user (see userContext),
 * so tasks, feed, events and Google connections are private per user.
 *
 * ALLOWED_EMAILS (comma-separated rules):
 *   me@gmail.com   exact address
 *   @gmail.com     any address on that domain (also *@gmail.com)
 *   *              any signed-in user
 * MUSE_API_TOKEN: shared secret for scripts (acts as the local user).
 * With neither set the API is open and everything belongs to the local user (development).
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hmkdafydnmouvmdvgwin.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_3k8MdQMUoI-zhCXze3dBIA_LD_hBBjT';
const CACHE_MS = 5 * 60_000;

const allowRules = () =>
  (process.env.ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase().replace(/^\*@/, '@'))
    .filter(Boolean);

export function isEmailAllowed(email: string, rules = allowRules()) {
  const e = email.toLowerCase();
  return rules.some((rule) => rule === '*' || (rule.startsWith('@') ? e.endsWith(rule) : e === rule));
}

export const isAuthEnabled = () => !!process.env.MUSE_API_TOKEN || allowRules().length > 0;

const verified = new Map<string, { email: string; until: number }>();

async function emailForSupabaseToken(token: string): Promise<string | null> {
  const hit = verified.get(token);
  if (hit && hit.until > Date.now()) return hit.email;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const user: any = await res.json();
    const email = String(user?.email || '').toLowerCase();
    // Only trust addresses the provider has verified (Google sign-in always is)
    if (!email || !(user.email_confirmed_at || user.confirmed_at)) return null;
    if (verified.size > 500) verified.clear();
    verified.set(token, { email, until: Date.now() + CACHE_MS });
    return email;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isAuthEnabled()) return runAsUser(LOCAL_USER, next);

  const header = req.header('authorization');
  // EventSource cannot send headers, so the SSE stream passes ?token=
  const token = header?.startsWith('Bearer ') ? header.slice(7) : (req.query.token as string | undefined);
  if (!token) return res.status(401).json({ success: false, error: 'Please sign in' });

  if (process.env.MUSE_API_TOKEN && token === process.env.MUSE_API_TOKEN) return runAsUser(LOCAL_USER, next);

  const email = await emailForSupabaseToken(token);
  if (!email) return res.status(401).json({ success: false, error: 'Session expired, please sign in again' });
  if (!isEmailAllowed(email)) {
    return res.status(403).json({ success: false, error: `${email} is not allowed to use this Muse server` });
  }
  return runAsUser(email, next);
}

// ---------------------------------------------------------------------------
// Per-user daily limit on agent runs (protects the Gemini / Browserbase bill)
// ---------------------------------------------------------------------------

const usage = new Map<string, { day: string; count: number }>();

export function agentRunLimit(user: string): { ok: boolean; limit: number } {
  const limit = Number(process.env.DAILY_AGENT_LIMIT || 100);
  if (!limit || user === LOCAL_USER) return { ok: true, limit };
  const day = new Date().toISOString().slice(0, 10);
  const entry = usage.get(user);
  const count = entry && entry.day === day ? entry.count : 0;
  if (count >= limit) return { ok: false, limit };
  usage.set(user, { day, count: count + 1 });
  return { ok: true, limit };
}

/** Express middleware for routes that start an agent run */
export function limitAgentRuns(user: () => string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const { ok, limit } = agentRunLimit(user());
    if (!ok) {
      return res.status(429).json({ success: false, error: `Daily limit of ${limit} agent runs reached. Try again tomorrow.` });
    }
    next();
  };
}
