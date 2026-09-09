import { type FollowerDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class FollowerService {
  getFollowersCount = async (userId: string) => {
    const url = `follower/followers/count/${userId}`;
    const resData = await callAuthApi<number>(url, API.GET);
    return resData;
  };

  getFollowings = async () => {
    const url = 'follower/followings';
    const resData = await callAuthApi<FollowerDto[]>(url, API.GET);
    return resData;
  };

  upsertFollower = async (payload: FollowerDto) => {
    const url = 'follower/upsert';
    const resData = await callAuthApi<FollowerDto>(url, API.POST, payload);
    return resData;
  };
}

const instance = new FollowerService();
export default instance;
