interface IBatchOptions {
  /** How long to wait for more keys after the first one arrives. */
  delayMs: number;
  /** Keys per call; a larger burst is split across several. */
  maxBatchSize: number;
}

/**
 * Coalesces single-key lookups made in the same moment into one `fetchMany` call, so thirty images
 * mounting together cost one request instead of thirty. Each caller gets its own key's value, and
 * `undefined` when the batch did not return that key or the call failed; `fetchMany` reports its
 * own errors, once per batch rather than once per caller.
 */
export const createBatcher = <V>(
  fetchMany: (keys: string[]) => Promise<Map<string, V>>,
  { delayMs, maxBatchSize }: IBatchOptions,
) => {
  let pending = new Map<string, ((value: V | undefined) => void)[]>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    const batch = pending;
    pending = new Map();
    timer = null;
    const keys = [...batch.keys()];
    for (let start = 0; start < keys.length; start += maxBatchSize) {
      const chunk = keys.slice(start, start + maxBatchSize);
      fetchMany(chunk)
        .catch(() => new Map<string, V>())
        .then((values) => chunk.forEach((key) => batch.get(key)?.forEach((resolve) => resolve(values.get(key)))));
    }
  };

  return (key: string): Promise<V | undefined> =>
    new Promise((resolve) => {
      pending.set(key, [...(pending.get(key) ?? []), resolve]);
      timer ??= setTimeout(flush, delayMs);
    });
};
