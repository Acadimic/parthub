import { Marking, QuestionType } from '../enums';
import { type DefaultMarkingType } from '../interfaces';

const FOUR_MARKS = {
  [Marking.CORRECT]: 4,
  [Marking.INCORRECT]: 0,
  [Marking.UNATTEMPTED]: 0,
  [Marking.PARTIALLY_CORRECT]: 0,
};

/** The marks a generated question gets when neither the reply nor the section says otherwise. */
export const DEFAULT_MARKINGS: DefaultMarkingType = {
  [QuestionType.SINGLE_CHOICE]: { ...FOUR_MARKS },
  [QuestionType.MULTIPLE_CHOICE]: { ...FOUR_MARKS },
  [QuestionType.BOOLEAN]: { ...FOUR_MARKS },
  [QuestionType.INTEGER]: { ...FOUR_MARKS },
  [QuestionType.FILL_IN_THE_BLANK]: { ...FOUR_MARKS },
  [QuestionType.SUBJECTIVE]: { ...FOUR_MARKS },
};
