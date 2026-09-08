import { toPayload } from '@repo/ui/lib';
import { ISubject } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class SubjectService {
  upsertSubject = async (payload: ISubject) => {
    const url = 'subject/upsert';
    const resData = await callAuthApi(url, API.POST, toPayload(payload));
    return resData;
  };

  getSubjects = async () => {
    const url = 'subject/all';
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new SubjectService();
export default instance;
