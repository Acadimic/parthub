import { ISubject } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class SubjectService {
  upsertSubject = async (payload: ISubject) => {
    const url = `subject/${Subdomain.ADMIN}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getSubjects = async () => {
    const url = `subject/${Subdomain.ADMIN}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new SubjectService();
export default instance;
