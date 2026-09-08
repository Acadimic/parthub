import { toPayload } from '@repo/ui/lib';
import { IMeet } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MeetService {
  upsertMeet = async (payload: IMeet) => {
    const url = 'meet/upsert';
    const resData = await callAuthApi(url, API.POST, toPayload(payload));
    return resData;
  };

  getMeets = async () => {
    const url = 'meet/all';
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new MeetService();
export default instance;
