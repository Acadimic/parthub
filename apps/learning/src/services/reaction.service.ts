import { type ReactionDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class ReactionService {
  getReactionsCount = async (itemId: string) => {
    const url = `reaction/count/${itemId}`;
    const resData = await callAuthApi<number>(url, API.GET);
    return resData;
  };

  getReactions = async () => {
    const url = 'reaction/all';
    const resData = await callAuthApi<ReactionDto[]>(url, API.GET);
    return resData;
  };

  upsertReaction = async (payload: ReactionDto) => {
    const url = 'reaction/upsert';
    const resData = await callAuthApi<ReactionDto>(url, API.POST, payload);
    return resData;
  };
}

const instance = new ReactionService();
export default instance;
