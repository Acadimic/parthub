import { LevelType, QuestionType } from '@enums';

export interface IGeneratedQuestionsPrompt {
  numberOfQuestions: number;
  questionType: QuestionType;
  standardNames: string[];
  subjectNames: string[];
  levels: LevelType[];
  prompt: string;
}

export interface IGeneratedMaterialPrompt {
  topic: string;
  standardName: string;
  subjectName: string;
  chapterName?: string | null;
  prompt: string;
}
