import { IMeet } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class MeetService {
  upsertMeet = async (payload: IMeet) => {
    const url = `meet/${Subdomain.TEACH}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getMeets = async () => {
    const url = `meet/${Subdomain.TEACH}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new MeetService();
export default instance;
