import { type InitialDataResponse, type PublicDataResponse } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi, callDefaultApi, callUnAuthApi } from './http.service';

interface IPresignedPutUrlRequest {
  key: string;
  fileType: string;
  isPublic?: boolean;
}

interface IPresignedPutUrlsRequest {
  keys: IPresignedPutUrlRequest[];
}

class CommonService {
  getInitialData = async () => {
    return await callAuthApi<InitialDataResponse>('common/initial-data', API.GET);
  };

  getPublicData = async () => {
    return await callUnAuthApi<PublicDataResponse>('common/public-data', API.GET);
  };

  getPreSignedPUTUrls = async (payload: IPresignedPutUrlsRequest) => {
    const url = 'common/presigned-PUT-urls';
    const resData = await callAuthApi<string[]>(url, API.POST, payload);
    return resData;
  };

  getPreSignedGETUrls = async (fileUrls: string[]) => {
    const url = 'common/presigned-GET-urls';
    const resData = await callAuthApi<string[]>(url, API.POST, fileUrls);
    return resData;
  };

  uploadWithPreSignedUrl = async (presignedUrl: string, file: File) => {
    const headers = { 'Content-Type': file.type };
    const res = await callDefaultApi().put(presignedUrl, file, { headers });
    return res.data;
  };
}

export default new CommonService();
