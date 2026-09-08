import { toPayload } from '@repo/ui/lib';
import { IQuestion } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class QuestionService {
  upsertQuestion = async (payload: IQuestion) => {
    const url = 'question/upsert';
    const resData = await callAuthApi(url, API.POST, toPayload(payload));
    return resData;
  };

  getQuestions = async () => {
    const url = 'question/all';
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new QuestionService();
export default instance;
