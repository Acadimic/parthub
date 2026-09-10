import { type SuccessResponse } from '@repo/shared/responses';
import axios, { type AxiosError } from 'axios';
import { API, StorageKey, Subdomain } from '../enums';
import { generateAndSetNewToken } from '../utils/firebase';
import { getToken, getUtcOffset, handleError } from '../utils/helpers';
import { toPayload } from '@repo/ui/lib';

const createAxiosInstance = (isUnAuth: boolean, url: string) => {
  const axiosInstance = axios.create({
    baseURL: url,
    headers: {
      'Content-Type': 'application/json',
      'timezone-offset': getUtcOffset(),
    },
  });

  if (isUnAuth) return axiosInstance;

  axiosInstance.interceptors.request.use(async (config) => {
    await generateAndSetNewToken();
    try {
      const token = getToken();
      if (config.headers && token) {
        // Both credentials travel together, deliberately, while this app moves to private APIs.
        //
        // `api-key` is what @Private() routes check. It comes from a NEXT_PUBLIC_ variable, so it
        // is inlined into the browser bundle and readable by anyone who opens this app — it is not
        // a secret, and @Private() is not a security boundary while that is true.
        //
        // The bearer token is still required, because four of the endpoints this app calls
        // (common/initial-data, standard/all, standard/mapping/all, subject/all) are shared with
        // teaching and learning and are therefore ordinary authenticated routes. They cannot
        // become private without breaking those apps.
        config.headers['api-key'] = process.env.NEXT_PUBLIC_PRIVATE_API_KEY;
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.app = Subdomain.SUPPORT;
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
