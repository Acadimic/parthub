import { SuccessResponse } from '@repo/shared';
import axios, { AxiosError } from 'axios';
import { API } from '../enums';
import { generateAndSetNewToken } from '../utils/firebase';
import { getToken, getUtcOffset, handleError } from '../utils/helpers';

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
        config.headers['api-key'] = process.env.NEXT_PUBLIC_PRIVATE_API_KEY;
      }
      return config;
    } catch (error) {
      console.log('Axios req error: ', error);
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
    const response =
      method === API.POST ? await axiosInstance.post(url, data) : await axiosInstance.get(url, { params: data });
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
    const response =
      method === API.POST ? await axiosInstance.post(url, data) : await axiosInstance.get(url, { params: data });
    return response.data;
  } catch (error) {
    // handleError throws unless the caller opted out, in which case there is nothing to return.
    handleError(error as AxiosError, shouldNotThrowError);
    return { data: undefined as T };
  }
};

export const callDefaultApi = () => axios.create();
