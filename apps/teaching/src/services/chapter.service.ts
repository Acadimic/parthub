import { IGetStandardSubjectChapters } from '@interfaces';
import { IChapter } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class ChapterService {
  upsertChapter = async (payload: IChapter) => {
    const url = `chapter/${Subdomain.TEACH}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getStandardSubjectChapters = async (payload: IGetStandardSubjectChapters) => {
    const url = `chapter/${Subdomain.TEACH}/standard/subject/all`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getOrgChapters = async () => {
    const url = `chapter/${Subdomain.TEACH}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new ChapterService();
export default instance;
