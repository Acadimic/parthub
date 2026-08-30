import { IFollower } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class FollowerService {
  getFollowersCount = async (userId: string) => {
    const url = `follower/${Subdomain.LEARN}/followers/count/${userId}`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  getFollowings = async () => {
    const url = `follower/${Subdomain.LEARN}/followings`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  upsertFollower = async (payload: IFollower) => {
    const url = `follower/${Subdomain.LEARN}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };
}

const instance = new FollowerService();
export default instance;
