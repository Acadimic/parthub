/**
 * Keys the MobX State Tree models add for the UI and the API never accepts.
 *
 * The server's global validation pipe runs with `forbidNonWhitelisted`, so a single undeclared
 * property fails the whole request. Posting a store instance straight through therefore returns
 * 400 rather than saving anything.
 *
 * Each app's `http.service.ts` applies this to every request body and query object, so a service
 * method cannot forget it. It used to be each caller's job, and the one array endpoint that was
 * missed went unnoticed because Nest skips validation on array bodies entirely.
 *
 * Three kinds of key end up here:
 *
 * - **Form state.** `isNew` marks a record the user is still creating. It exists on nineteen
 *   models across the three apps.
 * - **Request state.** `isLoading*` and `isLoaded*` track a fetch in progress on the instance.
 * - **Fields the server never stored.** `topic`, `isBonus` and `links` appear on
 *   client models but in no schema and no DTO, and `reactionsCount` and `followersCount` are
 *   derived counts. If any of these should be persisted, add it to the schema and the entity's
 *   DTO and remove it from this list. Until then it is dropped, which is what already happens in
 *   practice.
 */
export const CLIENT_ONLY_KEYS = [
  'isNew',
  'isLoadingReactionsCount',
  'isLoadedReactionsCount',
  'isLoadingFollowersCount',
  'isLoadedFollowersCount',
  'isLoadedCompletedModules',
  'isLoadedContents',
  'isLoadedOutline',
  'reactionsCount',
  'followersCount',
  'topic',
  'isBonus',
  'links',
] as const;

export type ClientOnlyKey = (typeof CLIENT_ONLY_KEYS)[number];

/** A request body: the instance's own fields, without the ones the UI added. */
export type ApiPayload<T> = Omit<T, ClientOnlyKey>;

const CLIENT_ONLY = new Set<string>(CLIENT_ONLY_KEYS);

const strip = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(strip);
  if (value === null || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (CLIENT_ONLY.has(key)) continue;
    out[key] = strip(child);
  }
  return out;
};

/**
 * Turns a store instance into a request body.
 *
 * Takes a plain snapshot first, so a MobX State Tree instance and its nested instances are both
 * handled, then removes every client-only key at any depth — including inside an array, which is
 * how a bulk upsert of models is handled.
 *
 * `callAuthApi` and `callUnAuthApi` already call this on everything they send, so a service method
 * does not. Call it directly only when building a body outside the HTTP layer.
 */
export const toPayload = <T extends object>(source: T): ApiPayload<T> =>
  strip(JSON.parse(JSON.stringify(source))) as ApiPayload<T>;
