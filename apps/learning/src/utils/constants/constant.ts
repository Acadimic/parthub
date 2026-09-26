import { AccountSettingsType, StandardGroup } from '../../enums';
import { type IDynamicObject } from '../../interfaces';

export const RANDOM = '';

export const ENV = {
  PRODUCTION: {
    KEY: 'production',
    URL: 'https://api.parthhub.com',
  },
  DEVELOPMENT: {
    KEY: 'development',
    URL: 'https://api.parthhub.com',
  },
  LOCAL: {
    KEY: 'local',
    URL: 'http://localhost:8080',
  },
};

export const TOKEN = 'token_parthub';

export const TOTOKEN_GENERATION_TIME = 'token_generation_time_parthhub';

export const STANDARDS = {
  JEE_MAINS: 'JEE Mains',
  JEE_ADVANCED: 'JEE Advanced',
  NEET: 'NEET',
  CLASS_XI: 'Class XI',
  CLASS_XII: 'Class XII',
  OTHER: 'other',
};

export const QUESTION_TYPES = {
  BOOLEAN: 'boolean',
  SINGLE_CHOICE: 'singleChoice',
  MULTIPLE_CHOICE: 'multipleChoice',
  INTEGER: 'integer',
  FILL_IN_THE_BLANK: 'fillInTheBlank',
  TEXT: 'text',
};

export const VIEW_QUESTION_TYPES = {
  BOOLEAN: 'True / False',
  SINGLE_CHOICE: 'Single Choice',
  MULTIPLE_CHOICE: 'Multiple Choice',
  INTEGER: 'Numeric',
  FILL_IN_THE_BLANK: 'Fill In The Blank',
  TEXT: 'Subjective',
};

export const MARKS = {
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
  UNATTEMPTED: 'unattempted',
};

export const STANDARD_QUESTION_TYPES = {
  [STANDARDS.JEE_MAINS]: [
    { _id: QUESTION_TYPES.SINGLE_CHOICE, name: VIEW_QUESTION_TYPES.SINGLE_CHOICE },
    { _id: QUESTION_TYPES.INTEGER, name: VIEW_QUESTION_TYPES.INTEGER },
  ],
  [STANDARDS.JEE_ADVANCED]: [
    { _id: QUESTION_TYPES.SINGLE_CHOICE, name: VIEW_QUESTION_TYPES.SINGLE_CHOICE },
    { _id: QUESTION_TYPES.MULTIPLE_CHOICE, name: VIEW_QUESTION_TYPES.MULTIPLE_CHOICE },
    { _id: QUESTION_TYPES.INTEGER, name: VIEW_QUESTION_TYPES.INTEGER },
  ],
  [STANDARDS.NEET]: [{ _id: QUESTION_TYPES.SINGLE_CHOICE, name: VIEW_QUESTION_TYPES.SINGLE_CHOICE }],
  [STANDARDS.OTHER]: [
    { _id: QUESTION_TYPES.SINGLE_CHOICE, name: VIEW_QUESTION_TYPES.SINGLE_CHOICE },
    { _id: QUESTION_TYPES.MULTIPLE_CHOICE, name: VIEW_QUESTION_TYPES.MULTIPLE_CHOICE },
    { _id: QUESTION_TYPES.INTEGER, name: VIEW_QUESTION_TYPES.INTEGER },
    { _id: QUESTION_TYPES.BOOLEAN, name: VIEW_QUESTION_TYPES.BOOLEAN },
    { _id: QUESTION_TYPES.FILL_IN_THE_BLANK, name: VIEW_QUESTION_TYPES.FILL_IN_THE_BLANK },
    { _id: QUESTION_TYPES.TEXT, name: VIEW_QUESTION_TYPES.TEXT },
  ],
};

export const MARKS_MAPPINGS = {
  [STANDARDS.JEE_MAINS]: {
    [QUESTION_TYPES.SINGLE_CHOICE]: {
      [MARKS.CORRECT]: 4,
      [MARKS.INCORRECT]: -1,
      [MARKS.UNATTEMPTED]: 0,
    },
    [QUESTION_TYPES.INTEGER]: {
      [MARKS.CORRECT]: 4,
      [MARKS.INCORRECT]: 0,
      [MARKS.UNATTEMPTED]: 0,
    },
  },
  [STANDARDS.JEE_ADVANCED]: {
    [QUESTION_TYPES.SINGLE_CHOICE]: {
      [MARKS.CORRECT]: 3,
      [MARKS.INCORRECT]: -1,
      [MARKS.UNATTEMPTED]: 0,
    },
    [QUESTION_TYPES.MULTIPLE_CHOICE]: {
      [MARKS.CORRECT]: 4,
      [MARKS.INCORRECT]: -1,
      [MARKS.UNATTEMPTED]: 0,
    },
    [QUESTION_TYPES.INTEGER]: {
      [MARKS.CORRECT]: 3,
      [MARKS.INCORRECT]: 0,
      [MARKS.UNATTEMPTED]: 0,
    },
  },
  [STANDARDS.NEET]: {
    [QUESTION_TYPES.SINGLE_CHOICE]: {
      [MARKS.CORRECT]: 4,
      [MARKS.INCORRECT]: -1,
      [MARKS.UNATTEMPTED]: 0,
    },
  },
  [STANDARDS.OTHER]: {
    [QUESTION_TYPES.SINGLE_CHOICE]: {
      [MARKS.CORRECT]: 4,
      [MARKS.INCORRECT]: 0,
      [MARKS.UNATTEMPTED]: 0,
    },
    [QUESTION_TYPES.MULTIPLE_CHOICE]: {
      [MARKS.CORRECT]: 4,
      [MARKS.INCORRECT]: 0,
      [MARKS.UNATTEMPTED]: 0,
    },
    [QUESTION_TYPES.INTEGER]: {
      [MARKS.CORRECT]: 4,
      [MARKS.INCORRECT]: 0,
      [MARKS.UNATTEMPTED]: 0,
    },
    [QUESTION_TYPES.BOOLEAN]: {
      [MARKS.CORRECT]: 4,
      [MARKS.INCORRECT]: 0,
      [MARKS.UNATTEMPTED]: 0,
    },
    [QUESTION_TYPES.TEXT]: {
      [MARKS.CORRECT]: 4,
      [MARKS.INCORRECT]: 0,
      [MARKS.UNATTEMPTED]: 0,
    },
    [QUESTION_TYPES.FILL_IN_THE_BLANK]: {
      [MARKS.CORRECT]: 4,
      [MARKS.INCORRECT]: 0,
      [MARKS.UNATTEMPTED]: 0,
    },
  },
};

export const WEEK_DAYS_INTEGER_MAPPINGS: Record<string, string> = {
  '0': 'Sunday',
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
  '6': 'Saturday',
};

export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  INSTITUTE: 'institute',
  SCHOOL: 'school',
};

export const PAPER_TYPES = {
  PREVIOUS_YEAR: 'previous year',
  MODEL_PAPER: 'model paper',
  ASSIGNMENT: 'assignment',
  QUIZ: 'quiz',
  MOCK: 'mock',
  EXAM: 'exam',
};

export const BATCHES = [
  { _id: 1, name: 'Batch 1' },
  { _id: 2, name: 'Batch 2' },
  { _id: 3, name: 'Batch 3' },
  { _id: 4, name: 'Batch 4' },
  { _id: 5, name: 'Batch 5' },
  { _id: 6, name: 'Batch 6' },
  { _id: 7, name: 'Batch 7' },
  { _id: 8, name: 'Batch 8' },
  { _id: 9, name: 'Batch 9' },
];

export const BATCH_TABS = {
  BATCH_STUDENTS: 'Batch Students',
  MANAGE_ATTENDENCE: 'Manage Attendence',
  ASSIGN_TEACHERS: 'Assign Teachers',
  SCHEDULE_CLASSES: 'Schedule Classes',
  ADD_STUDY_MATERIALS: 'Add Study Materials',
  ADD_ASSIGNMETS: 'Add Assignments',
};

export const DEFAULT_CHAPTER_NAMES = {
  SYLLABUS: 'Syllabus',
  INDEX: 'Index',
  CHAPTERS: 'Chapters',
  BOOKS: 'Books',
  NOTES: 'Notes',
  PAPERS: 'Papers',
  ANSWERS: 'Answers',
  REFERENCES: 'References',
  APPENDIX: 'Appendix',
};

export const CONTENT_TYPES = {
  SYLLABUS: 'syllabus',
  INDEX: 'index',
  CHAPTER: 'chapter',
  BOOK: 'book',
  NOTE: 'note',
  PAPER: 'paper',
  ANSWER: 'answer',
  REFERENCE: 'reference',
  APPENDIX: 'appendix',
};

export const CHAPTER_UTILS = [
  {
    _id: CONTENT_TYPES.SYLLABUS,
    name: DEFAULT_CHAPTER_NAMES.SYLLABUS,
    type: CONTENT_TYPES.SYLLABUS,
    order: 1,
  },
  {
    _id: CONTENT_TYPES.INDEX,
    name: DEFAULT_CHAPTER_NAMES.INDEX,
    type: CONTENT_TYPES.INDEX,
    order: 2,
  },
  {
    _id: CONTENT_TYPES.CHAPTER,
    name: DEFAULT_CHAPTER_NAMES.CHAPTERS,
    type: CONTENT_TYPES.CHAPTER,
    order: 10,
  },
  {
    _id: CONTENT_TYPES.BOOK,
    name: DEFAULT_CHAPTER_NAMES.BOOKS,
    type: CONTENT_TYPES.BOOK,
    order: 999989,
  },
  {
    _id: CONTENT_TYPES.NOTE,
    name: DEFAULT_CHAPTER_NAMES.NOTES,
    type: CONTENT_TYPES.NOTE,
    order: 999990,
  },
  {
    _id: CONTENT_TYPES.PAPER,
    name: DEFAULT_CHAPTER_NAMES.PAPERS,
    type: CONTENT_TYPES.PAPER,
    order: 999991,
  },
  {
    _id: CONTENT_TYPES.ANSWER,
    name: DEFAULT_CHAPTER_NAMES.ANSWERS,
    type: CONTENT_TYPES.ANSWER,
    order: 999992,
  },
  {
    _id: CONTENT_TYPES.REFERENCE,
    name: DEFAULT_CHAPTER_NAMES.REFERENCES,
    type: CONTENT_TYPES.REFERENCE,
    order: 999993,
  },
  {
    _id: CONTENT_TYPES.APPENDIX,
    name: DEFAULT_CHAPTER_NAMES.APPENDIX,
    type: CONTENT_TYPES.APPENDIX,
    order: 999994,
  },
];

export const OPTIONS = ['Small', 'Medium', 'Large'];

export const MAX_HEIGHTS = [150, 250, 350];

export const STANDARD_GROUP_ORDER: IDynamicObject = {
  [StandardGroup.CLASSES]: 100,
  [StandardGroup.COMPETITIVE_EXAMS]: 500,
  [StandardGroup.POST_GRADUATE_COMPETITIVE_EXAMS]: 1000,
  [StandardGroup.GATE]: 1500,
  [StandardGroup.GENERAL]: 1200,
  [StandardGroup.OLYMPIADS]: 1300,
  [StandardGroup.UNDERGRADUATE]: 1400,
  [StandardGroup.POST_GRADUATE]: 1600,
  [StandardGroup.LEARNING_TRACKS]: 1700,
  [StandardGroup.LANGUAGES]: 1800,
};

export const ACTIONS = 'actions';

export const ALL = 'ALL';

export const AccountSettingsRoutes: Record<AccountSettingsType, string> = {
  [AccountSettingsType.ACCOUNT_SETTINGS]: '/account-settings',
  [AccountSettingsType.PROFILE]: '/account-settings/profile',
  [AccountSettingsType.SECURITY]: '/account-settings/security',
};
