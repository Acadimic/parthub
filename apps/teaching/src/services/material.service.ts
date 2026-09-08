import { IStandardSubjectQuery } from '@interfaces';
import { IMaterial } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class MaterialService {
  upsertMaterial = async (payload: IMaterial) => {
    const url = `material/${Subdomain.TEACH}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getMaterials = async () => {
    const url = `material/${Subdomain.TEACH}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  getStandardSubjectMaterials = async (payload: IStandardSubjectQuery) => {
    const url = `material/${Subdomain.TEACH}/standard/subject/all`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getStandardsMaterials = async (standards: string[]) => {
    const url = `material/${Subdomain.TEACH}/standards/all`;
    const resData = await callAuthApi(url, API.POST, standards);
    return resData;
  };
}

const instance = new MaterialService();
export default instance;
