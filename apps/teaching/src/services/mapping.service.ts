import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class MappingService {
  getOrgStudentStandardMappings = async () => {
    const url = `mappings/${Subdomain.TEACH}/student/standard`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new MappingService();
export default instance;
