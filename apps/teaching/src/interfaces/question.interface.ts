import { type MarkingType } from '@repo/shared';
import { type QuestionType } from '@enums';

export interface ICreateQuestion {
  standard: string;
  subject?: string;
  questionType: QuestionType;
  section: string;
  subsection?: string;
  markings: MarkingType;
}
