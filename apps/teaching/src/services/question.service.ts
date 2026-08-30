import { IQuestion } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class QuestionService {
  upsertQuestion = async (payload: IQuestion) => {
    const url = `question/${Subdomain.TEACH}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getQuestions = async () => {
    const url = `question/${Subdomain.TEACH}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

const instance = new QuestionService();
export default instance;
