import { API } from '../enums';
import { callAuthApi } from './http.service';

class TestPaperService {
  getTestPapers = async () => {
    return await callAuthApi('test-paper', API.GET);
  };
}

export default new TestPaperService();
