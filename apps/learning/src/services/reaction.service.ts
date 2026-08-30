import { IReaction } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class ReactionService {
  getReactionsCount = async (itemId: string) => {
    const url = `reaction/${Subdomain.LEARN}/count/${itemId}`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  getReactions = async () => {
    const url = `reaction/${Subdomain.LEARN}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  upsertReaction = async (payload: IReaction) => {
    const url = `reaction/${Subdomain.LEARN}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };
}

const instance = new ReactionService();
export default instance;
