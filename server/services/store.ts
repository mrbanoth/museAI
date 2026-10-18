import fs from 'fs';
import path from 'path';

export type TaskCategory = 'tracking' | 'goals';
export type TaskStatus = 'active' | 'paused' | 'done';
export type RunStatus = 'COMPLETED' | 'FAILED';

export interface TaskRecord {
  id: string;
  title: string;
  subtitle: string;
  category: TaskCategory;
  /** Optional target page; when absent the agent decides where to look */
  url?: string;
  /** Human schedule string, e.g. "Every 6 hours", "Daily at 9:00", "Weekly on Monday at 8:00", "Manual" */
  schedule: string;
  status: TaskStatus;
  checked: boolean;
  runsCount: number;
  isRunning: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: RunStatus;
  lastSummary?: string;
  lastReplayUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedRecord {
  id: string;
  category: string;
  title: string;
  summary: string;
  createdAt: string;
  sourceUrl?: string;
  replayUrl?: string;
  tags: string[];
  icon: string;
  taskId?: string;
}

interface DbShape {
  tasks: TaskRecord[];
  feed: FeedRecord[];
}

const DATA_DIR = process.env.MUSE_DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MAX_FEED = 200;

function load(): DbShape {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { tasks: parsed.tasks || [], feed: parsed.feed || [] };
  } catch {
    return { tasks: [], feed: [] };
  }
}

const db: DbShape = load();

let writeTimer: ReturnType<typeof setTimeout> | null = null;
function persist() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
      fs.renameSync(tmp, DB_FILE);
    } catch (e: any) {
      console.error('[Store] Failed to persist db:', e.message);
    }
  }, 50);
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const Store = {
  listTasks(): TaskRecord[] {
    return db.tasks;
  },

  getTask(id: string): TaskRecord | undefined {
    return db.tasks.find((t) => t.id === id);
  },

  createTask(input: Partial<TaskRecord> & { title: string }): TaskRecord {
    const now = new Date().toISOString();
    const task: TaskRecord = {
      id: newId('task'),
      title: input.title,
      subtitle: input.subtitle || '',
      category: input.category === 'goals' ? 'goals' : 'tracking',
      url: input.url || undefined,
      schedule: input.schedule || 'Manual',
      status: 'active',
      checked: false,
      runsCount: 0,
      isRunning: false,
      nextRunAt: input.nextRunAt,
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.unshift(task);
    persist();
    return task;
  },

  updateTask(id: string, patch: Partial<TaskRecord>): TaskRecord | undefined {
    const task = db.tasks.find((t) => t.id === id);
    if (!task) return undefined;
    Object.assign(task, patch, { id: task.id, updatedAt: new Date().toISOString() });
    persist();
    return task;
  },

  deleteTask(id: string): boolean {
    const before = db.tasks.length;
    db.tasks = db.tasks.filter((t) => t.id !== id);
    persist();
    return db.tasks.length !== before;
  },

  listFeed(): FeedRecord[] {
    return db.feed;
  },

  addFeed(item: Omit<FeedRecord, 'id' | 'createdAt'>): FeedRecord {
    const record: FeedRecord = { ...item, id: newId('feed'), createdAt: new Date().toISOString() };
    db.feed.unshift(record);
    if (db.feed.length > MAX_FEED) db.feed.length = MAX_FEED;
    persist();
    return record;
  },
};
