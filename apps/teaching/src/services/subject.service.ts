import { API } from '../enums';
import { type SubjectDto } from '@repo/shared';
import { callAuthApi } from './http.service';

class SubjectService {
  getSubjects = async () => {
    const url = 'subject/all';
    const resData = await callAuthApi<SubjectDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new SubjectService();
export default instance;
