import { type MeetDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class MeetService {
  /** Body is `{ ids }`: it used to post `{ courseId, meetIds }`, which `GetByMeetIdsDto` rejected
   *  with a 400 under the global `forbidNonWhitelisted`. */
  getMeetsByIds = async (ids: string[]) => {
    const url = 'meet/by-ids';
    const resData = await callAuthApi<MeetDto[]>(url, API.POST, { ids });
    return resData;
  };

  /** The sessions the signed-in learner is an attendee of. */
  getMyMeets = async () => {
    const url = 'meet/my';
    const resData = await callAuthApi<MeetDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new MeetService();
export default instance;
