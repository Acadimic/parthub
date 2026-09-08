import type { IRequestState, RequestStatus } from '../interfaces/request.interface';

/** The starting state for every tracked request. */
export const IDLE_REQUEST: IRequestState = { status: 'idle' };

export const isRequestLoading = (request?: IRequestState): boolean => request?.status === 'loading';

export const isRequestLoaded = (request?: IRequestState): boolean => request?.status === 'loaded';

export const isRequestFailed = (request?: IRequestState): boolean => request?.status === 'error';

/**
 * Whether a fetch still needs to run. Replaces the two-flag guard
 * `if (!isLoadedX && !isLoadingX) loadX()` with one call that cannot be written the wrong way
 * round — and it retries after a failure, which the boolean version never did.
 */
export const shouldLoadRequest = (request?: IRequestState): boolean =>
  !request || request.status === 'idle' || request.status === 'error';

/** One request, flattened into the branches a screen actually renders. */
export interface IRequestView {
  status: RequestStatus;
  isLoading: boolean;
  isLoaded: boolean;
  isFailed: boolean;
  /** Set only when `isFailed`. */
  error?: string;
}

/**
 * Flattens a request into the booleans a component branches on.
 *
 * Pure, and deliberately not a hook: `useRequest` in `@repo/ui/hooks` is a one-line wrapper over
 * this, so the mapping can be tested without a renderer.
 */
export const toRequestView = (request: IRequestState): IRequestView => ({
  status: request.status,
  isLoading: isRequestLoading(request),
  isLoaded: isRequestLoaded(request),
  isFailed: isRequestFailed(request),
  error: request.error,
});
