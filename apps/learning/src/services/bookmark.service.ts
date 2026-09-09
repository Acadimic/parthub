import { type BookmarkDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class BookmarkService {
  getBookmarks = async () => {
    const url = 'bookmark/all';
    const resData = await callAuthApi<BookmarkDto[]>(url, API.GET);
    return resData;
  };

  upsertBookmark = async (payload: BookmarkDto) => {
    const url = 'bookmark/upsert';
    const resData = await callAuthApi<BookmarkDto>(url, API.POST, payload);
    return resData;
  };
}

const instance = new BookmarkService();
export default instance;
