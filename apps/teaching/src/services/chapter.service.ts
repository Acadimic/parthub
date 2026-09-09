import { type IStandardSubjectQuery } from '@interfaces';
import { API } from '../enums';
import { type ChapterDto } from '@repo/shared/contracts';
import { callAuthApi } from './http.service';

class ChapterService {
  upsertChapter = async (payload: ChapterDto) => {
    const url = 'chapter/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getStandardSubjectChapters = async (payload: IStandardSubjectQuery) => {
    const url = 'chapter/standard/subject/all';
    const resData = await callAuthApi<ChapterDto[]>(url, API.POST, payload);
    return resData;
  };

  getOrgChapters = async () => {
    const url = 'chapter/all';
    const resData = await callAuthApi<ChapterDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new ChapterService();
export default instance;
