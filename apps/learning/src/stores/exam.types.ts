import { type IRichText } from '@repo/shared/interfaces';
import { type Marking, type PaperCategoryType, type PaperType } from '../enums';

/** Seconds spent, per question id. */
export interface IQuestionWiseTimeTakenMap {
  [questionId: string]: number;
}
export interface IResultMap {
  [questionId: string]: Marking;
}
export interface IAnswerMap {
  [questionId: string]: string[];
}
export interface ISectionWiseQuestionsMap {
  [sectionId: string]: string[];
}
export type IResultCount = { [key in Marking]: number };
export interface ISummaryCount {
  notVisited: number;
  notAnswered: number;
  answered: number;
  markedForReview: number;
  answeredAndMarkedForReview: number;
}

/**
 * One exam sitting. Entirely client-side — there is no exam DTO and nothing here is posted; the
 * paper, its questions and the learner's marks are what get saved.
 */
export interface IExam {
  _id: string;
  testPaper: string;
  /** The course the paper was opened from; the save goes through it. */
  course: string;
  title: string;
  instruction: IRichText;
  questionWiseSpendTime: IQuestionWiseTimeTakenMap;
  questionWiseReplyTime: IQuestionWiseTimeTakenMap;
  totalSpendTime: number;
  /** The correct option ids, per question. */
  answerMaps: IAnswerMap;
  /** The option ids the learner picked, per question. */
  responseMaps: IAnswerMap;
  visited: string[];
  markedForReviews: string[];
  sectionWiseQuestionIdsMaps: ISectionWiseQuestionsMap;
  numberOfQuestions: number;
  durationMins: number;
  maxMarks: number;
  year: number;
  sections: string[];
  questions: string[];
  standards: string[];
  subjects: string[];
  resultMaps: IResultMap;
  isPractice: boolean;
  isSubmitted: boolean;
  paperCategory: PaperCategoryType;
  paperType: PaperType;
}
