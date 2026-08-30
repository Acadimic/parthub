import { IPresignedPutUrlsRequest } from '@interfaces';
import { API, Subdomain } from '../enums';
import { callAuthApi, callDefaultApi } from './http.service';

class CommonService {
  getInitialData = async () => {
    const url = `common/${Subdomain.TEACH}/initial-data`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  getPreSignedPUTUrls = async (payload: IPresignedPutUrlsRequest) => {
    const url = `common/presigned-PUT-urls`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getPreSignedGETUrls = async (fileUrls: string[]) => {
    const url = `common/presigned-GET-urls`;
    const resData = await callAuthApi(url, API.POST, fileUrls);
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
