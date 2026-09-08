import { IStandardSubjectQuery } from '@interfaces';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MaterialService {
  getMaterials = async () => {
    return await callAuthApi('material', API.GET);
  };

  getStandardSubjectMaterials = async (payload: IStandardSubjectQuery) => {
    const url = 'material/standard/subject/all';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getStandardsMaterials = async (standards: string[]) => {
    const url = 'material/standards/all';
    const resData = await callAuthApi(url, API.POST, standards);
    return resData;
  };
}

export default new MaterialService();
