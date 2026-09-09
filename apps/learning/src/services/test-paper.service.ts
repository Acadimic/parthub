import { type TestPaperSectionsResponse } from '@repo/shared/contracts';
import { type IQuestion, type ITestPaper, type ITestPaperSection } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

/**
 * The wire shape of `test-paper/sections-with-questions/:testPaperId`, narrowed to what the stores
 * hold. The DTO leaves these optional because a write body need not send them, so a reader that
 * needs one narrows first.
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
