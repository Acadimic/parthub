import { type MaterialDto } from '@repo/shared/contracts';
import { type IStandardSubjectQuery } from '@interfaces';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MaterialService {
  upsertMaterial = async (payload: MaterialDto) => {
    const url = 'material/upsert';
    const resData = await callAuthApi<MaterialDto>(url, API.POST, payload);
    return resData;
  };

  /** Every material the org owns, as rows — the list screen rolls them up itself. */
  getMaterials = async () => {
    const url = 'material/all';
    const resData = await callAuthApi<MaterialDto[]>(url, API.GET);
    return resData;
  };

  getStandardSubjectMaterials = async (payload: IStandardSubjectQuery) => {
    const url = 'material/standard/subject/all';
    const resData = await callAuthApi<MaterialDto[]>(url, API.POST, payload);
    return resData;
  };

  getStandardsMaterials = async (standardIds: string[]) => {
    const url = 'material/standards/all';
    // Wrapped in an object because the route validates `StandardIdsQueryDto`; Nest skips validation
    // on a bare array body entirely, so posting the ids on their own silently matched nothing.
    const resData = await callAuthApi<MaterialDto[]>(url, API.POST, { standards: standardIds });
    return resData;
  };
}

const instance = new MaterialService();
export default instance;
