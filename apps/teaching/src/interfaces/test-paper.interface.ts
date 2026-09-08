import { type IOption, type IQuestion, type ISolution } from '@stores';

interface IQuestionObject {
  question: IQuestion;
  options: IOption[];
  solution?: ISolution;
}

export interface IUpsertSectionQuestion extends IQuestionObject {
  testPaper: string;
}

export interface IUpsertBulkSectionQuestions {
  testPaper: string;
  questions: IQuestionObject[];
}

export interface IMergeTestPapers {
  primaryTestPaperId: string;
  secondaryTestPaperId: string;
}
