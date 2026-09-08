import { type IMaterialStat } from '@interfaces';
import { type IStandardSubjectQuery } from '@interfaces';
import { type IMaterial } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MaterialService {
  upsertMaterial = async (payload: IMaterial) => {
    const url = 'material/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getMaterials = async () => {
    const url = 'material/all';
    const resData = await callAuthApi<IMaterialStat[]>(url, API.GET);
    return resData;
  };

  getStandardSubjectMaterials = async (payload: IStandardSubjectQuery) => {
    const url = 'material/standard/subject/all';
    const resData = await callAuthApi<IMaterial[]>(url, API.POST, payload);
    return resData;
  };

  getStandardsMaterials = async (standards: string[]) => {
    const url = 'material/standards/all';
    const resData = await callAuthApi<IMaterial[]>(url, API.POST, standards);
    return resData;
  };
}

const instance = new MaterialService();
export default instance;
