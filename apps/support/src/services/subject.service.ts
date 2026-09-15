import { type SubjectDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class SubjectService {
  upsertSubject = async (payload: SubjectDto) => {
    const url = 'subject/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getSubjects = async () => {
    const url = 'subject/private-all';
    const resData = await callAuthApi<SubjectDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new SubjectService();
export default instance;
