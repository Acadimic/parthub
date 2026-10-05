import { type SuccessResponse } from '@repo/shared/responses';
import { Subdomain } from '@enums';

/** A slow API must not hold up a page: past this the caller falls back. */
const SERVER_API_TIMEOUT_MS = 3000;

/** A missing row and a failed call lead to different pages, so the two are told apart. */
export type ServerApiResult<T> = { status: 'ok'; data: T } | { status: 'not-found' } | { status: 'failed' };

/**
 * Calls a `@Public()` route from the Next server — `getServerSideProps`, the sitemap — where the
 * browser's axios callers, with their session and interceptors, do not apply.
 */
export const fetchPublicApi = async <T>(path: string): Promise<ServerApiResult<T>> => {
  const apiUrl = process.env.API_SERVER_URL;
  if (!apiUrl) return { status: 'failed' };
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/${path}`, {
      headers: { app: Subdomain.LEARN },
      signal: AbortSignal.timeout(SERVER_API_TIMEOUT_MS),
    });
    if (response.status === 404) return { status: 'not-found' };
    if (!response.ok) return { status: 'failed' };
    const body = (await response.json()) as SuccessResponse<T>;
    return body.data === undefined ? { status: 'failed' } : { status: 'ok', data: body.data };
  } catch {
    return { status: 'failed' };
  }
};
