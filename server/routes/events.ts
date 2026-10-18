import { Router, Request, Response } from 'express';
import { onEvent, eventsSince, currentSeq } from '../services/events';
import { currentUser } from '../services/userContext';

const router = Router();

/**
 * Server-Sent Events stream (used by web via EventSource).
 */
router.get('/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const me = currentUser();
  const since = Number(req.query.since || req.header('Last-Event-ID') || currentSeq());
  for (const e of eventsSince(since, me)) {
    res.write(`id: ${e.seq}\ndata: ${JSON.stringify(e)}\n\n`);
  }

  const off = onEvent((e) => {
    if (e.owner === me) res.write(`id: ${e.seq}\ndata: ${JSON.stringify(e)}\n\n`);
  });
  const ping = setInterval(() => res.write(': ping\n\n'), 20000);

  req.on('close', () => {
    off();
    clearInterval(ping);
  });
});

/**
 * Long-poll fallback for React Native, which has no EventSource.
 * Returns immediately when events newer than `since` exist, otherwise waits up to 25s.
 */
router.get('/', (req: Request, res: Response) => {
  const me = currentUser();
  const since = req.query.since !== undefined ? Number(req.query.since) : currentSeq();
  const pending = eventsSince(since, me);
  if (pending.length > 0) {
    return res.json({ seq: currentSeq(), events: pending });
  }

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    off();
    clearTimeout(timer);
    res.json({ seq: currentSeq(), events: eventsSince(since, me) });
  };
  const off = onEvent((e) => {
    if (e.owner === me) setTimeout(finish, 50);
  });
  const timer = setTimeout(finish, 25000);
  req.on('close', () => {
    done = true;
    off();
    clearTimeout(timer);
  });
});

export default router;
