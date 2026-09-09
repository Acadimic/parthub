import { type QuestionDto } from '@repo/shared/contracts';
import { type IOption, type ISolution } from '@stores';

interface IQuestionObject {
  question: QuestionDto;
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
