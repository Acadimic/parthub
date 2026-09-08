import { type IStandardSubjectQuery } from '@interfaces';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class ChapterService {
  getStandardSubjectChapters = async (payload: IStandardSubjectQuery) => {
    const url = 'chapter/standard/subject/all';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };
}

const instance = new ChapterService();
export default instance;
