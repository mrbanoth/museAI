import { NextFunction, Request, Response } from 'express';

/**
 * API access control:
 * - MUSE_API_TOKEN: shared secret (scripts / local use)
 * - ALLOWED_EMAILS: only these Supabase users may call the API (verified server-side)
 * With neither set the API is open (local development).
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hmkdafydnmouvmdvgwin.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_3k8MdQMUoI-zhCXze3dBIA_LD_hBBjT';
const CACHE_MS = 5 * 60_000;

const allowedEmails = () =>
  (process.env.ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAuthEnabled = () => !!process.env.MUSE_API_TOKEN || allowedEmails().length > 0;

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
    if (!email) return null;
    if (verified.size > 500) verified.clear();
    verified.set(token, { email, until: Date.now() + CACHE_MS });
    return email;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isAuthEnabled()) return next();

  const header = req.header('authorization');
  // EventSource cannot send headers, so the SSE stream passes ?token=
  const token = header?.startsWith('Bearer ') ? header.slice(7) : (req.query.token as string | undefined);
  if (!token) return res.status(401).json({ success: false, error: 'Please sign in' });

  if (process.env.MUSE_API_TOKEN && token === process.env.MUSE_API_TOKEN) return next();

  const allowed = allowedEmails();
  if (allowed.length) {
    const email = await emailForSupabaseToken(token);
    if (email && allowed.includes(email)) return next();
    if (email) return res.status(403).json({ success: false, error: `${email} is not allowed to use this Muse server` });
  }
  return res.status(401).json({ success: false, error: 'Session expired, please sign in again' });
}
