import { IDLE_REQUEST, isRequestFailed, isRequestLoaded, isRequestLoading, shouldLoadRequest } from './request.util';
import { type IRequestState, type IRequests } from '../interfaces/request.interface';

/**
 * The request-tracking half of a store: the state, the one writer, and the readers.
 *
 * `K` is the union of a store's fetch names, so `requests`, every getter and `run` all reject a
 * name the store did not declare. A typo is a compile error rather than a lookup that silently
 * returns `undefined` and reads as "not loading".
 */
export interface IRequestSlice<K extends string> {
  requests: IRequests<K>;
  /** The only writer. Prefer `run`, which sets every transition for you. */
  setRequest: (key: K, state: IRequestState) => void;
  isLoading: (key: K) => boolean;
  isLoaded: (key: K) => boolean;
  isFailed: (key: K) => boolean;
  /** True when untracked, idle or failed — so a failed fetch is retried, not stuck. */
  shouldLoad: (key: K) => boolean;
  /** The message from the last failure, or `undefined` when the request did not fail. */
  getError: (key: K) => string | undefined;
  /** Wraps a fetch: sets `loading`, then `loaded`, or `error` with the thrown message. */
  run: (key: K, fetcher: () => Promise<void>) => Promise<void>;
  /** Back to `idle`, for logout or an org switch. Does not touch the store's data. */
  resetRequests: () => void;
}

interface IRequestHolder<K extends string> {
  requests: IRequests<K>;
}

/**
 * Builds the slice for a store. Spread the result into the object passed to `create`:
 *
 * ```ts
 * export const useStandardStore = create<IStandardState>()((set, get) => ({
 *   standards: {},
 *   ...createRequestSlice(['standards', 'mappings'], set, get),
 *   loadStandards: () => get().run('standards', async () => { ... }),
 * }));
 * ```
 *
 * `keys` is listed explicitly so `requests` starts fully populated. A component can then select a
 * leaf (`(s) => s.requests.standards`) and get an `IRequestState` rather than `IRequestState |
 * undefined`, and the store's set of fetches is declared in one readable place.
 */
export const createRequestSlice = <K extends string>(
  keys: readonly K[],
  set: (partial: IRequestHolder<K>) => void,
  get: () => IRequestHolder<K>,
): IRequestSlice<K> => {
  // A plain loop rather than `Object.fromEntries`, which this package's `target` predates.
  const idle = (): IRequests<K> => {
    const requests = {} as IRequests<K>;
    for (const key of keys) requests[key] = IDLE_REQUEST;
    return requests;
  };

  const setRequest = (key: K, state: IRequestState) => {
    set({ requests: { ...get().requests, [key]: state } });
  };

  return {
    requests: idle(),
    setRequest,
    isLoading: (key) => isRequestLoading(get().requests[key]),
    isLoaded: (key) => isRequestLoaded(get().requests[key]),
    isFailed: (key) => isRequestFailed(get().requests[key]),
    shouldLoad: (key) => shouldLoadRequest(get().requests[key]),
    getError: (key) => get().requests[key]?.error,
    run: async (key, fetcher) => {
      setRequest(key, { status: 'loading' });
      try {
        await fetcher();
        setRequest(key, { status: 'loaded' });
      } catch (error) {
        setRequest(key, { status: 'error', error: error instanceof Error ? error.message : 'Request failed' });
      }
    },
    resetRequests: () => {
      set({ requests: idle() });
    },
  };
};
