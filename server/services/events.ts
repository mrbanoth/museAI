import { EventEmitter } from 'events';
import { currentUser } from './userContext';

export type MuseEventType =
  | 'task.updated'
  | 'task.deleted'
  | 'task.run.started'
  | 'task.run.finished'
  | 'feed.added'
  | 'agent.step'
  | 'connector.updated'
  | 'agent.done';

export interface MuseEvent {
  seq: number;
  type: MuseEventType;
  at: string;
  /** User the event belongs to; only that user's streams receive it */
  owner: string;
  /** Correlates agent.step events with the request that produced them */
  requestId?: string;
  data: any;
}

const bus = new EventEmitter();
bus.setMaxListeners(100);

const RECENT_LIMIT = 500;
const recent: MuseEvent[] = [];
let seq = 0;

export function emitEvent(type: MuseEventType, data: any, requestId?: string) {
  const event: MuseEvent = { seq: ++seq, type, at: new Date().toISOString(), owner: currentUser(), requestId, data };
  recent.push(event);
  if (recent.length > RECENT_LIMIT) recent.shift();
  bus.emit('event', event);
  return event;
}

export function onEvent(listener: (e: MuseEvent) => void) {
  bus.on('event', listener);
  return () => bus.off('event', listener);
}

export function eventsSince(since: number, owner: string): MuseEvent[] {
  return recent.filter((e) => e.seq > since && e.owner === owner);
}

export function currentSeq() {
  return seq;
}

/** Reports a progress step for a request; no-op without a requestId */
export function step(requestId: string | undefined, text: string, extra: Record<string, any> = {}) {
  if (!requestId) return;
  emitEvent('agent.step', { text, ...extra }, requestId);
}
