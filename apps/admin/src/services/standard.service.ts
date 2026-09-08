import { type StandardDto, type StandardSubjectMappingDto } from '@repo/shared';
import { type IStandard, type IStandardSubjectMapping } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class StandardService {
  upsertStandard = async (payload: IStandard) => {
    const url = 'standard/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertStandardSubjectMappings = async (payloads: IStandardSubjectMapping[]) => {
    const url = 'standard/mapping/bulk-upsert';
    const resData = await callAuthApi(url, API.POST, payloads);
    return resData;
  };

  getStandards = async () => {
    const url = 'standard/all';
    const resData = await callAuthApi<StandardDto[]>(url, API.GET);
    return resData;
  };

  getStandardSubjectMappings = async () => {
    const url = 'standard/mapping/all';
    const resData = await callAuthApi<StandardSubjectMappingDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new StandardService();
export default instance;
