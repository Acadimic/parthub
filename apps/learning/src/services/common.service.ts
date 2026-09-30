import { type IPresignedUrl, type PublicDataResponse } from '@repo/shared/contracts';
import { type IPresignedGetUrlsRequest, type IPresignedPutUrlsRequest } from '@interfaces';
import { API } from '../enums';
import { callAuthApi, callDefaultApi, callUnAuthApi } from './http.service';

class CommonService {
  /** The platform catalogue; `signed` also asks for the logos' signed URLs, for a visitor with no session. */
  getPublicData = async ({ signed }: { signed: boolean }) => {
    return await callUnAuthApi<PublicDataResponse>(`common/public-data${signed ? '?signed=true' : ''}`, API.GET);
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

export default new CommonService();
