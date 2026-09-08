import { type QuestionType } from '@enums';
import { type MarkingType } from '@stores';

export interface ICreateQuestion {
  standard: string;
  subject?: string;
  questionType: QuestionType;
  section: string;
  subsection?: string;
  markings: MarkingType;
}
