import { type MeetDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MeetService {
  upsertMeet = async (payload: MeetDto) => {
    const url = 'meet/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  /** `DELETE meet/:meetId` — the one collection here whose server route deletes rather than upserts a flag. */
  deleteMeet = async (meetId: string) => {
    const url = `meet/${meetId}`;
    const resData = await callAuthApi(url, API.DELETE);
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
