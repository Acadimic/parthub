import { type StandardDto, type StandardSubjectMappingDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class StandardService {
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
