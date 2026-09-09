import { type StudentStandardMappingDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MappingService {
  getOrgStudentStandardMappings = async () => {
    const url = 'mapping/student-standard/all';
    const resData = await callAuthApi<StudentStandardMappingDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new MappingService();
export default instance;
