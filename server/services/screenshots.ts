import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Final-page screenshots from browsing sessions, served at /shots/<id>.jpg.
 * Ids are 128-bit random (capability URLs) because <Image> can't send auth headers.
 */
const DIR = path.join(process.env.MUSE_DATA_DIR || path.join(__dirname, '..', 'data'), 'shots');
const MAX_FILES = 300;
const ID_RE = /^[a-f0-9]{32}$/;

export function saveScreenshot(jpeg: Buffer): string {
  fs.mkdirSync(DIR, { recursive: true });
  const id = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(path.join(DIR, `${id}.jpg`), jpeg, { mode: 0o600 });
  prune();
  return `/shots/${id}.jpg`;
}

export function screenshotPath(id: string): string | null {
  if (!ID_RE.test(id)) return null;
  const file = path.join(DIR, `${id}.jpg`);
  return fs.existsSync(file) ? file : null;
}

function prune() {
  try {
    const files = fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith('.jpg'))
      .map((f) => ({ f, t: fs.statSync(path.join(DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const old of files.slice(MAX_FILES)) fs.unlinkSync(path.join(DIR, old.f));
  } catch {}
}

/** Captures the current page as a small JPEG; never throws */
export async function capturePage(page: any): Promise<string | undefined> {
  try {
    const jpeg: Buffer = await page.screenshot({ type: 'jpeg', quality: 60, timeout: 8000 });
    return saveScreenshot(jpeg);
  } catch {
    return undefined;
  }
}
