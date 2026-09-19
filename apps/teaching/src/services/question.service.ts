import { type QuestionDto } from '@repo/shared/contracts';
import { API } from '../enums';
import { callAuthApi } from './http.service';

class QuestionService {
  upsertQuestion = async (payload: QuestionDto) => {
    const url = 'question/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  /** `POST question/bulk-upsert` — an import's questions in one request. */
  bulkUpsertQuestions = async (questions: QuestionDto[]) => {
    const url = 'question/bulk-upsert';
    const resData = await callAuthApi<QuestionDto[]>(url, API.POST, { questions });
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
