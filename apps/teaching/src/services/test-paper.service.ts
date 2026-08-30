import { IMergeTestPapers, IUpsertBulkSectionQuestions, IUpsertSectionQuestion } from '@interfaces';
import { ITestPaper, ITestPaperSection } from '@stores';
import { API, Subdomain } from '../enums';
import { callAuthApi } from './http.service';

class TestPaperService {
  upsertTestPaper = async (payload: ITestPaper) => {
    const url = `test-paper/${Subdomain.TEACH}/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertTestPaperSection = async (payload: ITestPaperSection) => {
    const url = `test-paper/${Subdomain.TEACH}/section/upsert`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertTestPaperSectionQuestion = async (payload: IUpsertSectionQuestion) => {
    const url = `test-paper/${Subdomain.TEACH}/section/upsert-question`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  upsertBulkTestPaperSectionQuestions = async (payload: IUpsertBulkSectionQuestions) => {
    const url = `test-paper/${Subdomain.TEACH}/section/upsert-bulk-questions`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };

  getTestPapers = async () => {
    const url = `test-paper/${Subdomain.TEACH}/all`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  getTestPaperSectionsWithQuestions = async (testPaperId: string) => {
    const url = `test-paper/${Subdomain.TEACH}/sections-with-questions/${testPaperId}`;
    const resData = await callAuthApi(url, API.GET);
    return resData;
  };

  mergeTestPapers = async (payload: IMergeTestPapers) => {
    const url = `test-paper/${Subdomain.TEACH}/merge`;
    const resData = await callAuthApi(url, API.POST, payload);
    return resData;
  };
}

const instance = new TestPaperService();
export default instance;
