import {
  ArticleIcon,
  CheckSquareIcon,
  HashIcon,
  type Icon,
  RadioButtonIcon,
  TextAUnderlineIcon,
  ToggleLeftIcon,
} from '@phosphor-icons/react';
import { QuestionType } from '@enums';

export interface IQuestionTypeMeta {
  label: string;
  /** One line under the label, in the type picker. */
  description: string;
  icon: Icon;
  /** The answer is picked from the options rather than typed. */
  hasChoices: boolean;
  /** More than one option can be correct. */
  isMultiple: boolean;
}

/**
 * How each question type presents itself, in the order the picker lists them: the common ones
 * first. `hasChoices` is what the two drawer steps and the paper view branch on, so a new type is
 * one entry here rather than a condition in four files.
 */
export const QUESTION_TYPES: Record<QuestionType, IQuestionTypeMeta> = {
  [QuestionType.SINGLE_CHOICE]: {
    label: 'Single choice',
    description: 'One correct option',
    icon: RadioButtonIcon,
    hasChoices: true,
    isMultiple: false,
  },
  [QuestionType.MULTIPLE_CHOICE]: {
    label: 'Multiple choice',
    description: 'One or more correct options',
    icon: CheckSquareIcon,
    hasChoices: true,
    isMultiple: true,
  },
  [QuestionType.BOOLEAN]: {
    label: 'True / False',
    description: 'Two fixed options',
    icon: ToggleLeftIcon,
    hasChoices: true,
    isMultiple: false,
  },
  [QuestionType.INTEGER]: {
    label: 'Integer',
    description: 'A number is typed in',
    icon: HashIcon,
    hasChoices: false,
    isMultiple: false,
  },
  [QuestionType.FILL_IN_THE_BLANK]: {
    label: 'Fill in the blank',
    description: 'A word or phrase is typed in',
    icon: TextAUnderlineIcon,
    hasChoices: false,
    isMultiple: false,
  },
  [QuestionType.SUBJECTIVE]: {
    label: 'Subjective',
    description: 'A written answer, marked by hand',
    icon: ArticleIcon,
    hasChoices: false,
    isMultiple: false,
  },
};

export const QUESTION_TYPE_ORDER = Object.keys(QUESTION_TYPES) as QuestionType[];

/** Meta for a type string off the wire, falling back to single choice for anything unknown. */
export const getQuestionTypeMeta = (type?: string): IQuestionTypeMeta =>
  QUESTION_TYPES[type as QuestionType] ?? QUESTION_TYPES[QuestionType.SINGLE_CHOICE];

/** A, B, C… for the nth option, the way a paper labels them. */
export const optionLetter = (index: number): string => String.fromCharCode(65 + (index % 26));
