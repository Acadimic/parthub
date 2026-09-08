import { type IRequestView, type IRequests, toRequestView } from '@repo/shared';
import { useEffect } from 'react';

/**
 * What these hooks need from a store, expressed structurally — which is why this file needs no
 * zustand dependency in `packages/ui`. Any store built with `createRequestSlice` satisfies it.
 */
interface IRequestStoreState<K extends string> {
  requests: IRequests<K>;
  shouldLoad: (key: K) => boolean;
}

interface IRequestStore<K extends string, S extends IRequestStoreState<K>> {
  <U>(selector: (state: S) => U): U;
  getState: () => S;
}

/**
 * Subscribes to one of a store's requests.
 *
 * The subscription is the request leaf, so the component re-renders for this fetch and not for a
 * sibling one. The flattening itself is `toRequestView` in `@repo/shared` — pure, and tested there
 * without a renderer. The returned object is derived per render, which is fine: it is a hook
 * result, not a selector result, so nothing compares it.
 *
 * Note that during SSR a zustand selector reads the store's *initial* state (zustand passes
 * `getInitialState` as the server snapshot), so a server-rendered screen always sees `idle`. That is
 * correct — no fetch has run on the server — and it is what keeps hydration consistent.
 *
 * ```tsx
 * const { isLoading, isFailed, error } = useRequest(useStandardStore, 'standards');
 * ```
 */
export const useRequest = <K extends string, S extends IRequestStoreState<K>>(
  store: IRequestStore<K, S>,
  key: K,
): IRequestView => toRequestView(store((state) => state.requests[key]));

/**
 * Subscribes to a request *and* starts it on mount if it has not run — the "load this screen's data
 * once" pattern, in one line.
 *
 * ```tsx
 * const { isLoading, isFailed, error } = useLoadOnce(useStandardStore, 'standards', (s) => s.loadStandards);
 * ```
 *
 * It replaces the four-line form (`useEffect` + a `shouldLoad` guard + selecting the loader + a
 * separate `isLoading` selection) and cannot be written the wrong way round. `shouldLoad` is read
 * through `getState()` at effect time rather than from a subscription, so a status change never
 * re-runs the effect and re-fires the fetch.
 *
 * Call the loader directly instead when a refetch is wanted unconditionally, such as after a save.
 */
export const useLoadOnce = <K extends string, S extends IRequestStoreState<K>>(
  store: IRequestStore<K, S>,
  key: K,
  selectLoader: (state: S) => () => Promise<void>,
): IRequestView => {
  const request = useRequest(store, key);
  const load = store(selectLoader);

  useEffect(() => {
    if (store.getState().shouldLoad(key)) load();
  }, [store, key, load]);

  return request;
};
