import { type IStandard, type IStandardSubjectMapping } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class StandardService {
  getStandards = async () => {
    const url = 'standard/all';
    const resData = await callAuthApi<IStandard[]>(url, API.GET);
    return resData;
  };

  getStandardSubjectMappings = async () => {
    const url = 'standard/mapping/all';
    const resData = await callAuthApi<IStandardSubjectMapping[]>(url, API.GET);
    return resData;
  };
}

const instance = new StandardService();
export default instance;
