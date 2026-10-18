import { Store, TaskRecord } from './store';
import { emitEvent } from './events';
import { processAgentChat } from './agentEngine';
import { computeNextRun } from './schedule';
import { runAsUser, LOCAL_USER } from './userContext';

const TICK_MS = 30_000;
const MAX_CONCURRENT = 2;
const running = new Set<string>();

function buildPrompt(task: TaskRecord) {
  const parts = [`Background task: "${task.title}".`];
  if (task.subtitle) parts.push(`Instructions: ${task.subtitle}`);
  if (task.url) parts.push(`Check this page: ${task.url}`);
  parts.push(
    task.lastSummary
      ? `Previous result (highlight what changed): ${task.lastSummary.slice(0, 800)}`
      : 'This is the first run.'
  );
  parts.push('Report the findings concisely. Do not create new scheduled tasks.');
  return parts.join('\n');
}

/**
 * Executes a task once through the agent, records the outcome and posts it to the feed.
 */
export async function runTask(taskId: string, trigger: 'manual' | 'schedule') {
  const task = Store.getTask(taskId);
  if (!task) throw new Error('Task not found');
  if (running.has(taskId)) throw new Error('Task is already running');

  running.add(taskId);
  const requestId = `task:${taskId}`;
  emitEvent('task.run.started', { taskId, trigger }, requestId);
  emitEvent('task.updated', Store.updateTask(taskId, { isRunning: true }));

  try {
    const result = await processAgentChat(buildPrompt(task), [], requestId);
    const browser = result.actions.find((a) => a.replayUrl);
    const failed = result.actions.length > 0 && result.actions.every((a) => a.status === 'FAILED');

    const feedItem = Store.addFeed({
      category: 'Goal Execution',
      title: task.title,
      summary: result.reply,
      sourceUrl: task.url || result.actions.find((a) => a.url)?.url,
      replayUrl: browser?.replayUrl,
      tags: [trigger === 'schedule' ? 'Scheduled' : 'Manual run', task.schedule],
      icon: 'task',
      taskId,
    });
    emitEvent('feed.added', feedItem);

    const updated = Store.updateTask(taskId, {
      isRunning: false,
      runsCount: task.runsCount + 1,
      lastRunAt: new Date().toISOString(),
      lastStatus: failed ? 'FAILED' : 'COMPLETED',
      lastSummary: result.reply,
      lastReplayUrl: browser?.replayUrl || task.lastReplayUrl,
      nextRunAt: computeNextRun(task.schedule)?.toISOString(),
    });
    emitEvent('task.updated', updated);
    emitEvent('task.run.finished', { taskId, status: updated?.lastStatus, feedItemId: feedItem.id }, requestId);
    return { task: updated, feedItem, actions: result.actions };
  } catch (err: any) {
    const updated = Store.updateTask(taskId, {
      isRunning: false,
      lastRunAt: new Date().toISOString(),
      lastStatus: 'FAILED',
      lastSummary: `Run failed: ${err.message}`,
      nextRunAt: computeNextRun(task.schedule)?.toISOString(),
    });
    emitEvent('task.updated', updated);
    emitEvent('task.run.finished', { taskId, status: 'FAILED', error: err.message }, requestId);
    throw err;
  } finally {
    running.delete(taskId);
  }
}

function tick() {
  const now = Date.now();
  const due = Store.listAllTasks().filter(
    (t) => t.status === 'active' && t.nextRunAt && Date.parse(t.nextRunAt) <= now && !running.has(t.id)
  );
  for (const task of due) {
    if (running.size >= MAX_CONCURRENT) break;
    console.log(`[Scheduler] Running "${task.title}" (${task.schedule})`);
    runAsUser(task.owner || LOCAL_USER, () => runTask(task.id, 'schedule')).catch((e) => console.warn(`[Scheduler] "${task.title}" failed:`, e.message));
  }
}

export function startScheduler() {
  // Recover from a crash mid-run and fill in missing next-run times
  for (const task of Store.listAllTasks()) {
    const patch: Partial<TaskRecord> = {};
    if (task.isRunning) patch.isRunning = false;
    if (task.status === 'active' && !task.nextRunAt) {
      const next = computeNextRun(task.schedule);
      if (next) patch.nextRunAt = next.toISOString();
    }
    if (Object.keys(patch).length) runAsUser(task.owner || LOCAL_USER, () => Store.updateTask(task.id, patch));
  }
  setInterval(tick, TICK_MS);
  setTimeout(tick, 2000);
  console.log(`[Scheduler] started, checking every ${TICK_MS / 1000}s`);
}
