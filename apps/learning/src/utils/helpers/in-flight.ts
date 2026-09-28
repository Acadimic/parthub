const inFlight = new Map<string, Promise<void>>();

/**
 * Runs `fetcher` unless the same `key` is already running, in which case the caller awaits that
 * run instead. Two screens (or one screen rendered twice) asking for the same rows then cost one
 * request. The key names the fetch and its argument, e.g. `courseOutline:<id>`.
 */
export const onceInFlight = (key: string, fetcher: () => Promise<void>): Promise<void> => {
  const running = inFlight.get(key);
  if (running) return running;
  const promise = fetcher().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
};
