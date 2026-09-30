import { type ILinkCheck, type IPresignedUrl, type PublicDataResponse } from '@repo/shared/contracts';
import { type IPresignedGetUrlsRequest, type IPresignedPutUrlsRequest } from '@interfaces';
import { API } from '../enums';
import { callAuthApi, callDefaultApi } from './http.service';

class CommonService {
  /** The platform catalogue: standards, subjects and their mappings. */
  getPublicData = async () => {
    const url = 'common/public-data';
    const resData = await callAuthApi<PublicDataResponse>(url, API.GET);
    return resData;
  };

  getPreSignedPUTUrls = async (payload: IPresignedPutUrlsRequest) => {
    const url = 'common/presigned-PUT-urls';
    const resData = await callAuthApi<IPresignedUrl[]>(url, API.POST, payload);
    return resData;
  };

  getPreSignedGETUrls = async (payload: IPresignedGetUrlsRequest) => {
    const url = 'common/presigned-GET-urls';
    const resData = await callAuthApi<IPresignedUrl[]>(url, API.POST, payload);
    return resData;
  };

  /** PUTs the file to its signed URL; `onProgress` gets 0–100 as the body goes up. */
  uploadWithPreSignedUrl = async (presignedUrl: string, file: File, onProgress?: (percent: number) => void) => {
    const headers = { 'Content-Type': file.type };
    const res = await callDefaultApi().put(presignedUrl, file, {
      headers,
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return res.data;
  };

  /** Looks the addresses up from the server, where cross-origin requests are allowed. */
  verifyLinks = async (urls: string[]) => {
    const url = 'common/verify-links';
    const resData = await callAuthApi<ILinkCheck[]>(url, API.POST, { urls });
    return resData;
  };

  deleteObjects = async (keys: string[]) => {
    const url = 'common/delete-objects';
    const resData = await callAuthApi<{ deleted: number }>(url, API.POST, { keys });
    return resData;
  };
}

const instance = new CommonService();
export default instance;
