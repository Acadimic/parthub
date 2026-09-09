import { type IStudentStandardMapping } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MappingService {
  getOrgStudentStandardMappings = async () => {
    const url = 'mapping/student-standard/all';
    const resData = await callAuthApi<IStudentStandardMapping[]>(url, API.GET);
    return resData;
  };
}

const instance = new MappingService();
export default instance;
