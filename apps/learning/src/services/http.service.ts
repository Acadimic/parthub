import { SuccessResponse } from '@parthhub/shared';
import axios, { AxiosError } from 'axios';
import { API, DefaultRole, StorageKey } from '../enums';
import { generateAndSetNewToken } from '../utils/firebase';
import { getToken, handleError } from '../utils/helpers';

export const callDefaultApi = () => axios.create();

const createAxiosInstance = (isUnAuth: boolean) => {
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (isUnAuth) return axiosInstance;

  axiosInstance.interceptors.request.use(async (config) => {
    await generateAndSetNewToken();
    try {
      const token = getToken();
      if (config.headers && token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.permission = DefaultRole.STUDENT;
        config.headers.organization = localStorage.getItem(StorageKey.ORGANIZATION);
      }
      return config;
    } catch (error) {
      console.log('Axios req error: ', error);
      return config;
    }
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error),
  );

  return axiosInstance;
};

/**
 * Calls an authenticated endpoint. `T` is the response contract from
 * `@parthhub/shared`, so the caller gets `{ data: T }` rather than `any`.
 */
export const callAuthApi = async <T = unknown>(
  url: string,
  method: API,
  data?: object | null,
  shouldNotThrowError?: boolean,
): Promise<SuccessResponse<T>> => {
  try {
    const axiosInstance = createAxiosInstance(false);
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
    const axiosInstance = createAxiosInstance(true);
    const response =
      method === API.POST ? await axiosInstance.post(url, data) : await axiosInstance.get(url, { params: data });
    return response.data;
  } catch (error) {
    // handleError throws unless the caller opted out, in which case there is nothing to return.
    handleError(error as AxiosError, shouldNotThrowError);
    return { data: undefined as T };
  }
};
