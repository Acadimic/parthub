import { IStandardSubjectQuery } from '@interfaces';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class ChapterService {
  getStandardSubjectChapters = async (payload: IStandardSubjectQuery) => {
    const url = `chapter/${Subdomain.LEARN}/standard/subject/all`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };
}

const instance = new ChapterService();
export default instance;
