import { IStandard, IStandardSubjectMapping } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class StandardService {
  upsertStandard = async (payload: IStandard) => {
    const url = `standard/${Subdomain.ADMIN}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertStandardSubjectMappings = async (payloads: IStandardSubjectMapping[]) => {
    const url = `standard/${Subdomain.ADMIN}/mapping/upsert-many`;
    const resData = await callAuthApi(url, API.POST, payloads);
    return resData;
  };

  getStandards = async () => {
    const url = `standard/${Subdomain.ADMIN}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  getStandardSubjectMappings = async () => {
    const url = `standard/${Subdomain.ADMIN}/mapping/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new StandardService();
export default instance;
