import { type TestPaperSectionsResponse } from '@repo/shared';
import { type IMergeTestPapers, type IUpsertBulkSectionQuestions, type IUpsertSectionQuestion } from '@interfaces';
import { type IQuestion, type ITestPaper, type ITestPaperSection } from '@stores';
import { API } from '../enums';
import { callAuthApi } from './http.service';

/**
 * The wire shape, with `questions` narrowed to what the store holds.
 *
 * This is the boundary where the client's assumption about always-present fields is asserted --
 * see `ClientEntityWith`. Everything above this line is the DTO as declared; everything below it
 * relies on the narrowing.
 */
interface ITestPaperSectionsResponse extends Omit<TestPaperSectionsResponse, 'questions' | 'sections'> {
  sections: ITestPaperSection[];
  questions: IQuestion[];
}

class TestPaperService {
  // Interim: declares the shape the store consumes until a TestPaper response contract exists.
  upsertTestPaper = async (payload: ITestPaper) => {
    const url = 'test-paper/upsert';
    const resData = await callAuthApi<ITestPaper>(url, API.POST, payload);
    return resData;
  };

  upsertTestPaperSection = async (payload: ITestPaperSection) => {
    const url = 'test-paper/section/upsert';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertTestPaperSectionQuestion = async (payload: IUpsertSectionQuestion) => {
    const url = 'test-paper/section/upsert-question';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertBulkTestPaperSectionQuestions = async (payload: IUpsertBulkSectionQuestions) => {
    const url = 'test-paper/section/upsert-bulk-questions';
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getTestPapers = async () => {
    const url = 'test-paper/all';
    const resData = await callAuthApi<ITestPaper[]>(url, API.GET);
    return resData;
  };

  getTestPaperSectionsWithQuestions = async (testPaperId: string) => {
    const url = `test-paper/sections-with-questions/${testPaperId}`;
    const resData = await callAuthApi<ITestPaperSectionsResponse>(url, API.GET);
    return resData;
  };

  // Interim: declares the shape the store consumes until a TestPaper response contract exists.
  mergeTestPapers = async (payload: IMergeTestPapers) => {
    const url = 'test-paper/merge';
    const resData = await callAuthApi<ITestPaper>(url, API.POST, payload);
    return resData;
  };
}

const instance = new TestPaperService();
export default instance;
