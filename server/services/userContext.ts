import { AsyncLocalStorage } from 'async_hooks';

/**
 * Tracks which user the current request / background run belongs to, so the store,
 * events and connectors stay per-user without threading an id through every call.
 */
const als = new AsyncLocalStorage<string>();

/** Owner used when API auth is disabled (local development) */
export const LOCAL_USER = 'local';

export const currentUser = () => als.getStore() || LOCAL_USER;

export function runAsUser<T>(user: string, fn: () => T): T {
  return als.run(user, fn);
}
