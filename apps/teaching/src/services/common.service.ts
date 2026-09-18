import { type InitialDataResponse, type IPresignedUrl } from '@repo/shared/contracts';
import { type IPresignedGetUrlsRequest, type IPresignedPutUrlsRequest } from '@interfaces';
import { API } from '../enums';
import { callAuthApi, callDefaultApi } from './http.service';

class CommonService {
  getInitialData = async () => {
    const url = 'common/initial-data';
    const resData = await callAuthApi<InitialDataResponse>(url, API.GET);
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

  uploadWithPreSignedUrl = async (presignedUrl: string, file: File) => {
    const headers = { 'Content-Type': file.type };
    const res = await callDefaultApi().put(presignedUrl, file, { headers });
    return res.data;
  };
}

const instance = new CommonService();
export default instance;
