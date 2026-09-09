import { type MeetDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MeetService {
  upsertMeet = async (payload: MeetDto) => {
    const url = 'meet/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getMeets = async () => {
    const url = 'meet/all';
    const resData = await callAuthApi<MeetDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new MeetService();
export default instance;
