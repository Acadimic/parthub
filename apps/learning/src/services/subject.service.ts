import { type ISubject } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class SubjectService {
  getSubjects = async () => {
    const url = 'subject/all';
    const resData = await callAuthApi<ISubject[]>(url, API.GET);
    return resData;
  };
}

const instance = new SubjectService();
export default instance;
