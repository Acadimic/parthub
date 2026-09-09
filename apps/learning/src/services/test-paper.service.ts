import { type TestPaperSectionsResponse } from '@repo/shared';
import { type IQuestion, type ITestPaper, type ITestPaperSection } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

/**
 * The wire shape of `test-paper/sections-with-questions/:testPaperId`, narrowed to what the stores
 * hold — see `ClientEntityWith` for why the client requires fields the DTO leaves optional.
 */
interface ITestPaperSectionsResponse extends Omit<TestPaperSectionsResponse, 'sections' | 'questions'> {
  sections: ITestPaperSection[];
  questions: IQuestion[];
}

class TestPaperService {
  getTestPapers = async () => {
    return await callAuthApi<ITestPaper[]>('test-paper/all', API.GET);
  };

  getTestPaperSectionsWithQuestions = async (testPaperId: string) => {
    const url = `test-paper/sections-with-questions/${testPaperId}`;
    const resData = await callAuthApi<ITestPaperSectionsResponse>(url, API.GET);
    return resData;
  };
}

export default new TestPaperService();
