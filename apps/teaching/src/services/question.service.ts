import { type QuestionDto } from '@repo/shared';
import { type IQuestion } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class QuestionService {
  upsertQuestion = async (payload: IQuestion) => {
    const url = 'question/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getQuestions = async () => {
    const url = 'question/all';
    const resData = await callAuthApi<QuestionDto[]>(url, API.GET);
    return resData;
  };
}

const instance = new QuestionService();
export default instance;
