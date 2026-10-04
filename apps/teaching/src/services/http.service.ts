import { type SuccessResponse } from '@repo/shared/responses';
import axios, { type AxiosError, type AxiosInstance } from 'axios';
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
      app: Subdomain.TEACH,
    },
  });

  if (isUnAuth) return axiosInstance;

  axiosInstance.interceptors.request.use(async (config) => {
    await generateAndSetNewToken();
    try {
      const token = getToken(Subdomain.TEACH);
      if (config.headers && token) {
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
/** One request by method. POST carries the body; GET and DELETE carry it as the query string. */
const send = (axiosInstance: AxiosInstance, method: API, url: string, body?: object | null) => {
  if (method === API.POST) return axiosInstance.post(url, body);
  if (method === API.DELETE) return axiosInstance.delete(url, { params: body });
  return axiosInstance.get(url, { params: body });
};

export const callAuthApi = async <T = unknown>(
  url: string,
  method: API,
  data?: object | null,
  shouldNotThrowError?: boolean,
): Promise<SuccessResponse<T>> => {
  try {
    const baseUrl = process.env.API_SERVER_URL || '';
    const axiosInstance = createAxiosInstance(false, baseUrl);
    // Strip UI-only keys here rather than at each call site: the server's validation pipe runs
    // with `forbidNonWhitelisted`, so one `isNew` on a posted store instance fails the whole
    // request. Binary uploads go through `callDefaultApi` and never reach this.
    const body = data ? toPayload(data) : data;
    const response = await send(axiosInstance, method, url, body);
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
    const response = await send(axiosInstance, method, url, body);
    return response.data;
  } catch (error) {
    // handleError throws unless the caller opted out, in which case there is nothing to return.
    handleError(error as AxiosError, shouldNotThrowError);
    return { data: undefined as T };
  }
};

export const callDefaultApi = () => axios.create();
