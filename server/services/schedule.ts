/**
 * Parses human schedule strings into the next run time.
 *
 * Supported forms (case-insensitive):
 *   "Manual"
 *   "Every 15 minutes" / "Every 6 hours" / "Every 2 days" / "Hourly"
 *   "Daily at 9:00" / "Daily at 9:00 AM" / "Every day at 21:30"
 *   "Weekly on Monday at 8:00" / "Weekly on Mondays"
 */

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseTime(text: string): { h: number; m: number } | null {
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let h = Number(match[1]);
  const m = Number(match[2] || 0);
  const ampm = match[3]?.toLowerCase();
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  if (h > 23 || m > 59) return null;
  return { h, m };
}

export function isValidSchedule(schedule: string): boolean {
  return /^manual$/i.test(schedule.trim()) || computeNextRun(schedule, new Date()) !== null;
}

export function computeNextRun(schedule: string, from: Date = new Date()): Date | null {
  const s = schedule.trim().toLowerCase();
  if (!s || s === 'manual') return null;

  if (s === 'hourly') return new Date(from.getTime() + 3600_000);

  const every = s.match(/^every\s+(\d+)?\s*(minute|min|hour|day)s?$/);
  if (every) {
    const n = Math.max(1, Number(every[1] || 1));
    const unit = every[2].startsWith('min') ? 60_000 : every[2] === 'hour' ? 3600_000 : 86400_000;
    const ms = Math.max(n * unit, 5 * 60_000);
    return new Date(from.getTime() + ms);
  }

  const daily = s.match(/^(daily|every day)(?:\s+at\s+(.+))?$/);
  if (daily) {
    const t = daily[2] ? parseTime(daily[2]) : { h: 9, m: 0 };
    if (!t) return null;
    const next = new Date(from);
    next.setHours(t.h, t.m, 0, 0);
    if (next <= from) next.setDate(next.getDate() + 1);
    return next;
  }

  const weekly = s.match(/^weekly(?:\s+on\s+([a-z]+?)s?)?(?:\s+at\s+(.+))?$/);
  if (weekly) {
    const dayIdx = weekly[1] ? DAYS.indexOf(weekly[1]) : 1;
    if (dayIdx < 0) return null;
    const t = weekly[2] ? parseTime(weekly[2]) : { h: 9, m: 0 };
    if (!t) return null;
    const next = new Date(from);
    next.setHours(t.h, t.m, 0, 0);
    const delta = (dayIdx - next.getDay() + 7) % 7;
    next.setDate(next.getDate() + delta);
    if (next <= from) next.setDate(next.getDate() + 7);
    return next;
  }

  return null;
}
