import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class MeetService {
  getMeetsByIds = async (courseId: string, meetIds: string[]) => {
    const url = `meet/${Subdomain.LEARN}/get-meets-by-ids`;
    const resData = await callAuthApi(url, API.POST, { courseId, meetIds });
    return resData;
  };
}

const instance = new MeetService();
export default instance;
