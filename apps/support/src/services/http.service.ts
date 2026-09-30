import { type SuccessResponse } from '@repo/shared/responses';
import axios, { type AxiosError } from 'axios';
import { API, StorageKey, Subdomain } from '../enums';
import { generateAndSetNewToken } from '../utils/firebase';
import { getTimezone, getTimezoneOffset, getToken, handleError } from '../utils/helpers';
import { toPayload } from '@repo/ui/lib';

const createAxiosInstance = (isUnAuth: boolean, url: string) => {
  const axiosInstance = axios.create({
    baseURL: url,
    headers: {
      'Content-Type': 'application/json',
      'timezone-offset': getTimezoneOffset(),
      timezone: getTimezone(),
      // Sent on every request, not just authenticated ones: the server refuses an authenticated or
      // private request that cannot say which app it came from, and @Subdomains routes read it to
      // decide access. It used to be set inside the auth interceptor, so unauthenticated calls
      // carried neither it nor a timezone.
      app: Subdomain.SUPPORT,
    },
  });

  if (isUnAuth) return axiosInstance;

  axiosInstance.interceptors.request.use(async (config) => {
    await generateAndSetNewToken();
    try {
      const token = getToken(Subdomain.SUPPORT);
      if (config.headers && token) {
        // `api-key` is what @Private() routes check, and every endpoint this app calls is now one.
        // It comes from a NEXT_PUBLIC_ variable, so it is inlined into the browser bundle and
        // readable by anyone who opens this app — it is not a secret, and @Private() is not a
        // security boundary while that is true.
        //
        // The bearer token no longer gates any endpoint here: the four shared reads moved to
        // private twins (`common/private-initial-data`, `standard/private-all`,
        // `standard/private-mapping/all`, `subject/private-all`). It is still sent because the app
        // signs users in with Firebase and the session is what decides whether the UI renders at
        // all — dropping it is a separate change to `_app.tsx`, not to this header.
        config.headers['api-key'] = process.env.NEXT_PUBLIC_PRIVATE_API_KEY;
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.organization = localStorage.getItem(StorageKey.ORGANIZATION);
      }
      return config;
    } catch (error) {
      console.error('Axios req error: ', error);
      return config;
    }
  });

  axiosInstance.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {
      return Promise.reject(error);
    },
  );

  return axiosInstance;
};

/**
 * Calls an authenticated endpoint. `T` is the response contract from
 * `@repo/shared`, so the caller gets `{ data: T }` rather than `any`.
 */
export const callAuthApi = async <T = unknown>(
  url: string,
  method: API,
  data?: object | null,
  shouldNotThrowError?: boolean,
): Promise<SuccessResponse<T>> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const axiosInstance = createAxiosInstance(false, baseUrl);
    // Strip UI-only keys here rather than at each call site: the server's validation pipe runs
    // with `forbidNonWhitelisted`, so one `isNew` on a posted store instance fails the whole
    // request. Binary uploads go through `callDefaultApi` and never reach this.
    const body = data ? toPayload(data) : data;
    const response =
      method === API.POST ? await axiosInstance.post(url, body) : await axiosInstance.get(url, { params: body });
    return response.data;
  } catch (error) {
    // handleError throws unless the caller opted out, in which case there is nothing to return.
    handleError(error as AxiosError, shouldNotThrowError);
    return { data: undefined as T };
  }
};

export const callUnAuthApi = async <T = unknown>(
  url: string,
  method: API,
  data?: object | null,
  shouldNotThrowError?: boolean,
): Promise<SuccessResponse<T>> => {
  try {
    const axiosInstance = createAxiosInstance(true, url);
    const body = data ? toPayload(data) : data;
    const response =
      method === API.POST ? await axiosInstance.post(url, body) : await axiosInstance.get(url, { params: body });
    return response.data;
  } catch (error) {
    // handleError throws unless the caller opted out, in which case there is nothing to return.
    handleError(error as AxiosError, shouldNotThrowError);
    return { data: undefined as T };
  }
};

export const callDefaultApi = () => axios.create();
