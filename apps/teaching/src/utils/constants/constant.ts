import { CalendarType, FCCalendarType, Marking, QuestionType } from '../../enums';

export const defaultMarkings = {
  [QuestionType.SINGLE_CHOICE]: {
    [Marking.CORRECT]: 4,
    [Marking.INCORRECT]: 0,
    [Marking.UNATTEMPTED]: 0,
    [Marking.PARTIALLY_CORRECT]: 0,
  },
  [QuestionType.MULTIPLE_CHOICE]: {
    [Marking.CORRECT]: 4,
    [Marking.INCORRECT]: 0,
    [Marking.UNATTEMPTED]: 0,
    [Marking.PARTIALLY_CORRECT]: 0,
  },
  [QuestionType.BOOLEAN]: {
    [Marking.CORRECT]: 4,
    [Marking.INCORRECT]: 0,
    [Marking.UNATTEMPTED]: 0,
    [Marking.PARTIALLY_CORRECT]: 0,
  },
  [QuestionType.INTEGER]: {
    [Marking.CORRECT]: 4,
    [Marking.INCORRECT]: 0,
    [Marking.UNATTEMPTED]: 0,
    [Marking.PARTIALLY_CORRECT]: 0,
  },
  [QuestionType.FILL_IN_THE_BLANK]: {
    [Marking.CORRECT]: 4,
    [Marking.INCORRECT]: 0,
    [Marking.UNATTEMPTED]: 0,
    [Marking.PARTIALLY_CORRECT]: 0,
  },
  [QuestionType.SUBJECTIVE]: {
    [Marking.CORRECT]: 4,
    [Marking.INCORRECT]: 0,
    [Marking.UNATTEMPTED]: 0,
    [Marking.PARTIALLY_CORRECT]: 0,
  },
};

export const CalendarTypeMap = {
  [FCCalendarType.DAY]: CalendarType.DAY,
  [FCCalendarType.WEEK]: CalendarType.WEEK,
  [FCCalendarType.MONTH]: CalendarType.MONTH,
  [FCCalendarType.LIST]: CalendarType.LIST,
};

export const CalendarViewMap = {
  [CalendarType.DAY]: FCCalendarType.DAY,
  [CalendarType.WEEK]: FCCalendarType.WEEK,
  [CalendarType.MONTH]: FCCalendarType.MONTH,
  [CalendarType.LIST]: FCCalendarType.LIST,
};
