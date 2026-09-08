/**
 * Keys the MobX State Tree models add for the UI and the API never accepts.
 *
 * The server's global validation pipe runs with `forbidNonWhitelisted`, so a single undeclared
 * property fails the whole request. Posting a store instance straight through therefore returns
 * 400 rather than saving anything, which is why every write goes through `toPayload` first.
 *
 * Three kinds of key end up here:
 *
 * - **Form state.** `isNew` marks a record the user is still creating. It exists on nineteen
 *   models across the three apps.
 * - **Request state.** `isLoading*` and `isLoaded*` track a fetch in progress on the instance.
 * - **Fields the server never stored.** `topic`, `isBonus`, `contentType` and `links` appear on
 *   client models but in no schema and no DTO, and `reactionsCount`, `followersCount` and
 *   `photoUrl` are either derived counts or a name the API does not use (it expects `avatar`).
 *   If any of these should be persisted, add it to the schema and the entity's DTO and remove it
 *   from this list. Until then it is dropped, which is what already happens in practice.
 */
export const CLIENT_ONLY_KEYS = [
  'isNew',
  'isLoadingReactionsCount',
  'isLoadedReactionsCount',
  'isLoadingFollowersCount',
  'isLoadedFollowersCount',
  'isLoadedCompletedModules',
  'isLoadedContents',
  'reactionsCount',
  'followersCount',
  'photoUrl',
  'topic',
  'isBonus',
  'contentType',
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
 * handled, then removes every client-only key at any depth. Use it for every write that sends a
 * model, including ones that nest models such as `{ course, plans }` or
 * `{ question, options, solution }`.
 */
export const toPayload = <T extends object>(source: T): ApiPayload<T> =>
  strip(JSON.parse(JSON.stringify(source))) as ApiPayload<T>;
