import { type IFollower } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class FollowerService {
  getFollowersCount = async (userId: string) => {
    const url = `follower/followers/count/${userId}`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  getFollowings = async () => {
    const url = 'follower/followings';
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  upsertFollower = async (payload: IFollower) => {
    const url = 'follower/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };
}

const instance = new FollowerService();
export default instance;
