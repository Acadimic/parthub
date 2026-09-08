import { toPayload } from '@repo/ui/lib';
import { type IStandardSubjectQuery } from '@interfaces';
import { type IChapter } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class ChapterService {
  upsertChapter = async (payload: IChapter) => {
    const url = 'chapter/upsert';
    const resData = await callAuthApi(url, API.POST, toPayload(payload));
    return resData;
  };

  getStandardSubjectChapters = async (payload: IStandardSubjectQuery) => {
    const url = 'chapter/standard/subject/all';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getOrgChapters = async () => {
    const url = 'chapter/all';
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new ChapterService();
export default instance;
