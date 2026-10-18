import { Router, Request, Response } from 'express';
import { Store, MAX_TASKS_PER_USER } from '../services/store';
import { emitEvent } from '../services/events';
import { runTask } from '../services/scheduler';
import { computeNextRun, isValidSchedule } from '../services/schedule';
import { assertPublicUrl } from '../services/browserbase';

const router = Router();

const param = (req: Request, key: string) => {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : v;
};

router.get('/', (_req: Request, res: Response) => {
  return res.json({ success: true, tasks: Store.listTasks() });
});

router.post('/', async (req: Request, res: Response) => {
  const { title, subtitle, category, url, schedule } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Field "title" is required.' });
  }
  if (Store.listTasks().length >= MAX_TASKS_PER_USER) {
    return res.status(400).json({ success: false, error: `You can have at most ${MAX_TASKS_PER_USER} tasks. Delete one first.` });
  }
  const sched = typeof schedule === 'string' && schedule.trim() ? schedule.trim() : 'Manual';
  if (!isValidSchedule(sched)) {
    return res.status(400).json({ success: false, error: `Unsupported schedule "${sched}".` });
  }
  if (url) {
    try {
      await assertPublicUrl(url);
    } catch (e: any) {
      return res.status(400).json({ success: false, error: e.message });
    }
  }
  const task = Store.createTask({
    title: title.trim(),
    subtitle: typeof subtitle === 'string' ? subtitle.trim() : '',
    category,
    url: url || undefined,
    schedule: sched,
    nextRunAt: computeNextRun(sched)?.toISOString(),
  });
  emitEvent('task.updated', task);
  return res.status(201).json({ success: true, task });
});

router.patch('/:id', (req: Request, res: Response) => {
  const id = param(req, 'id');
  const existing = Store.getTask(id);
  if (!existing) return res.status(404).json({ success: false, error: 'Task not found' });

  const { title, subtitle, schedule, status, checked, url } = req.body || {};
  const patch: Record<string, any> = {};
  if (typeof title === 'string' && title.trim()) patch.title = title.trim();
  if (typeof subtitle === 'string') patch.subtitle = subtitle;
  if (typeof url === 'string') patch.url = url || undefined;
  if (typeof checked === 'boolean') patch.checked = checked;
  if (typeof schedule === 'string') {
    if (!isValidSchedule(schedule)) {
      return res.status(400).json({ success: false, error: `Unsupported schedule "${schedule}".` });
    }
    patch.schedule = schedule;
  }
  if (status === 'active' || status === 'paused' || status === 'done') patch.status = status;

  const nextStatus = patch.status || existing.status;
  const nextSchedule = patch.schedule || existing.schedule;
  if ('schedule' in patch || 'status' in patch) {
    patch.nextRunAt = nextStatus === 'active' ? computeNextRun(nextSchedule)?.toISOString() : undefined;
  }

  const task = Store.updateTask(id, patch);
  emitEvent('task.updated', task);
  return res.json({ success: true, task });
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = param(req, 'id');
  if (!Store.deleteTask(id)) return res.status(404).json({ success: false, error: 'Task not found' });
  emitEvent('task.deleted', { id });
  return res.json({ success: true });
});

/**
 * Starts a run and returns immediately; progress and the result arrive over /api/events.
 */
router.post('/:id/run', (req: Request, res: Response) => {
  const id = param(req, 'id');
  const task = Store.getTask(id);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  if (task.isRunning) return res.status(409).json({ success: false, error: 'Task is already running' });

  runTask(id, 'manual').catch((e) => console.warn(`[Task Run] "${task.title}" failed:`, e.message));
  return res.status(202).json({ success: true, requestId: `task:${id}` });
});

export default router;
