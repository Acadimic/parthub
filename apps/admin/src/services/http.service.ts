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

export const callAuthApi = async (url: string, method: API, data?: object | null, shouldNotThrowError?: boolean) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const axiosInstance = createAxiosInstance(false, baseUrl);
    const response =
      method === API.POST ? await axiosInstance.post(url, data) : await axiosInstance.get(url, { params: data });
    return response.data;
  } catch (error) {
    return handleError(error as AxiosError, shouldNotThrowError);
  }
};

export const callUnAuthApi = async (url: string, method: API, data?: object | null, shouldNotThrowError?: boolean) => {
  try {
    const axiosInstance = createAxiosInstance(true, url);
    const response =
      method === API.POST ? await axiosInstance.post(url, data) : await axiosInstance.get(url, { params: data });
    return response.data;
  } catch (error) {
    return handleError(error as AxiosError, shouldNotThrowError);
  }
};

export const callDefaultApi = () => axios.create();
