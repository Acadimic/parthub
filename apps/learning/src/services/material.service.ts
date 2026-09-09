import { type IMaterial } from '@stores';
import { type IMaterialStat, type IStandardSubjectQuery } from '@interfaces';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MaterialService {
  getMaterials = async () => {
    return await callAuthApi<IMaterialStat[]>('material/all', API.GET);
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

export default new MaterialService();
