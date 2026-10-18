import fs from 'fs';
import path from 'path';
import { currentUser, LOCAL_USER } from './userContext';

export type TaskCategory = 'tracking' | 'goals';
export type TaskStatus = 'active' | 'paused' | 'done';
export type RunStatus = 'COMPLETED' | 'FAILED';

export interface TaskRecord {
  id: string;
  /** Email of the user who owns this task */
  owner: string;
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
  owner: string;
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

/** OAuth credentials for a linked third-party account (e.g. gmail, gcal) */
export interface ConnectionRecord {
  id: string;
  email?: string;
  scopes: string[];
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms when the access token expires */
  expiresAt: number;
  connectedAt: string;
}

interface DbShape {
  tasks: TaskRecord[];
  feed: FeedRecord[];
  connections: Record<string, ConnectionRecord>;
}

const DATA_DIR = process.env.MUSE_DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MAX_FEED = 200;

function load(): DbShape {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { tasks: parsed.tasks || [], feed: parsed.feed || [], connections: parsed.connections || {} };
  } catch {
    return { tasks: [], feed: [], connections: {} };
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
      // Contains OAuth tokens: readable by the server user only
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
      fs.renameSync(tmp, DB_FILE);
    } catch (e: any) {
      console.error('[Store] Failed to persist db:', e.message);
    }
  }, 50);
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// Records created before multi-user support belong to the local user
const ownerOf = (r: { owner?: string }) => r.owner || LOCAL_USER;
const mine = (r: { owner?: string }) => ownerOf(r) === currentUser();
const connectionKey = (service: string) => `${currentUser()}:${service}`;

/**
 * All reads/writes are scoped to currentUser(); the scheduler uses listAllTasks()
 * and runs each task as its owner.
 */
export const Store = {
  listTasks(): TaskRecord[] {
    return db.tasks.filter(mine);
  },

  listAllTasks(): TaskRecord[] {
    return db.tasks;
  },

  getTask(id: string): TaskRecord | undefined {
    return db.tasks.find((t) => t.id === id && mine(t));
  },

  createTask(input: Partial<TaskRecord> & { title: string }): TaskRecord {
    const now = new Date().toISOString();
    const task: TaskRecord = {
      id: newId('task'),
      owner: currentUser(),
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
    const task = this.getTask(id);
    if (!task) return undefined;
    Object.assign(task, patch, { id: task.id, owner: ownerOf(task), updatedAt: new Date().toISOString() });
    persist();
    return task;
  },

  deleteTask(id: string): boolean {
    const task = this.getTask(id);
    if (!task) return false;
    db.tasks = db.tasks.filter((t) => t !== task);
    persist();
    return true;
  },

  listFeed(): FeedRecord[] {
    return db.feed.filter(mine);
  },

  addFeed(item: Omit<FeedRecord, 'id' | 'createdAt' | 'owner'>): FeedRecord {
    const record: FeedRecord = { ...item, id: newId('feed'), owner: currentUser(), createdAt: new Date().toISOString() };
    db.feed.unshift(record);
    // Cap per user so one busy account can't push out everyone else's history
    const userItems = db.feed.filter(mine);
    if (userItems.length > MAX_FEED) {
      const drop = new Set(userItems.slice(MAX_FEED));
      db.feed = db.feed.filter((f) => !drop.has(f));
    }
    persist();
    return record;
  },

  getConnection(service: string): ConnectionRecord | undefined {
    return db.connections[connectionKey(service)];
  },

  saveConnection(record: ConnectionRecord) {
    db.connections[connectionKey(record.id)] = record;
    persist();
  },

  deleteConnection(service: string): boolean {
    const key = connectionKey(service);
    const existed = !!db.connections[key];
    delete db.connections[key];
    persist();
    return existed;
  },
};
