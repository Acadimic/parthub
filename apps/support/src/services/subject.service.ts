import { type SubjectDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class SubjectService {
  upsertSubject = async (payload: SubjectDto) => {
    const url = 'subject/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  /** `POST subject/delete` — soft-deletes the subject and every mapping that points at it. */
  deleteSubject = async (subjectId: string) => {
    const url = 'subject/delete';
    const resData = await callAuthApi(url, API.POST, { subjectId });
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
