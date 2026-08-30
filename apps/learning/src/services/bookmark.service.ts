import { IBookmark } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class BookmarkService {
  getBookmarks = async () => {
    const url = `bookmark/${Subdomain.LEARN}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  upsertBookmark = async (payload: IBookmark) => {
    const url = `bookmark/${Subdomain.LEARN}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };
}

const instance = new BookmarkService();
export default instance;
