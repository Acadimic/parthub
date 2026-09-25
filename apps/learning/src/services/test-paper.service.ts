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

  /**
   * A paper's sections and questions — through the course when one is open.
   *
   * `test-paper/sections-with-questions` reads under the caller's own organization, so it answers
   * with an empty paper for a course another organization published. The course route checks that
   * the course is visible and that the paper belongs to it, then reads under the course's owner.
   */
  getTestPaperSectionsWithQuestions = async (testPaperId: string, courseId?: string) => {
    const url = courseId
      ? `course/test-paper/sections/${courseId}/${testPaperId}`
      : `test-paper/sections-with-questions/${testPaperId}`;
    const resData = await callAuthApi<ITestPaperSectionsResponse>(url, API.GET);
    return resData;
  };
}

export default new TestPaperService();
