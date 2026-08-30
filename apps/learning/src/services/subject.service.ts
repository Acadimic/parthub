import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class SubjectService {
  getSubjects = async () => {
    const url = `subject/${Subdomain.LEARN}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new SubjectService();
export default instance;
