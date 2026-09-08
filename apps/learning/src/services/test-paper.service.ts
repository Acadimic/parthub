import { API } from '../enums';
import { callAuthApi } from './http.service';

class TestPaperService {
  getTestPapers = async () => {
    return await callAuthApi('test-paper/all', API.GET);
  };

  getTestPaperSectionsWithQuestions = async (testPaperId: string) => {
    const url = `test-paper/sections-with-questions/${testPaperId}`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };
}

export default new TestPaperService();
