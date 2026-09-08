/**
 * One shape for "is this fetch in flight, done, or failed", replacing the ad-hoc
 * `isLoadingX` / `isLoadedX` boolean pairs the MobX stores declare per resource.
 *
 * A single status field rather than two booleans, because two booleans have four states and only
 * three are meaningful — and the impossible fourth is where the bugs live. All three apps'
 * `standard.store.ts` currently end a load with `isLoadingStandard = true` where they meant
 * `isLoadedStandard = true`, which is exactly the mistake a status enum cannot express.
 */
export type RequestStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface IRequestState {
  status: RequestStatus;
  /** Set only when `status` is `'error'`. */
  error?: string;
}

/**
 * The request states a store tracks, keyed by resource name, so one store can own several
 * independent fetches: `IRequests<'standards' | 'subjects' | 'mappings'>`.
 */
export type IRequests<K extends string> = Record<K, IRequestState>;
