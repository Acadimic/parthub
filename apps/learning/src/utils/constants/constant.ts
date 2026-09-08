import { AccountSettingsType, ColorType, StandardGroup } from '../../enums';
import { IDynamicObject } from '../../interfaces';

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

export const SYMBOLS = [
  { name: 'Rupee', code: '&#8377;' },
  { name: 'Exist', code: '&#8707;' },
  { name: 'Element Of', code: '&#8712;' },
  { name: 'Not Element Of', code: '&#8713;' },
  { name: 'Contains', code: '&#8715;' },
  { name: 'Asterisk', code: '&#8727;' },
  { name: 'Alpha', code: '&alpha;' },
  { name: 'Beta', code: '&beta;' },
  { name: 'Gamma', code: '&gamma;' },
  { name: 'Delta', code: '&Delta;' },
  { name: 'delta', code: '&delta;' },
  { name: 'Epsilon', code: '&epsilon;' },
  { name: 'Zeta', code: '&zeta;' },
  { name: 'Eta', code: '&eta;' },
  { name: 'Theta', code: '&theta;' },
  { name: 'Iota', code: '&iota;' },
  { name: 'Kappa', code: '&Kappa;' },
  { name: 'kappa', code: '&kappa;' },
  { name: 'Lambda', code: '&Lambda;' },
  { name: 'lambda', code: '&lambda;' },
  { name: 'Mu', code: '&mu;' },
  { name: 'Nu', code: '&nu;' },
  { name: 'Xi', code: '&xi;' },
  { name: 'Omicron', code: '&omicron;' },
  { name: 'Pi', code: '&pi;' },
  { name: 'Rho', code: '&rho;' },
  { name: 'Sigma', code: '&sigma;' },
  { name: 'Tau', code: '&tau;' },
  { name: 'Upsilon', code: '&upsilon;' },
  { name: 'Phi', code: '&Phi;' },
  { name: 'phi', code: '&phi;' },
  { name: 'Chi', code: '&chi;' },
  { name: 'Psi', code: '&psi;' },
  { name: 'Omega', code: '&omega;' },
  { name: 'Addition', code: '&#43;' },
  { name: 'Subtraction', code: '&#8722;' },
  { name: 'Multiplication', code: '&#215;' },
  { name: 'Division', code: '&#247;' },
  { name: 'Plus Minus', code: '&#177;' },
  { name: 'Right Arrow', code: '&#8594;' },
  { name: 'Equal', code: '&#61;' },
  { name: 'Not Equal', code: '&#8800;' },
  { name: 'Triple Bar', code: '&#8801;' },
  { name: 'Cross Triple Bar', code: '&#8802;' },
  { name: 'Infinite', code: '&#8734;' },
  { name: 'Double Right Arrow', code: '&#8658;' },
  { name: 'Therefore', code: '&#8756;' },
  { name: 'Because', code: '&#8757;' },
  { name: 'Ratio', code: '&#8758;' },
  { name: 'Tilde', code: '&#8764;' },
  { name: 'Asymptotically Equal', code: '&#8771;' },
  { name: 'Subset', code: '&#8834;' },
  { name: 'Superset', code: '&#8835;' },
  { name: 'Not Subset', code: '&#8836;' },
  { name: 'Not Superset', code: '&#8837;' },
  { name: 'Subset Equal', code: '&#8838;' },
  { name: 'Superset Equal', code: '&#8839;' },
  { name: 'Proportional', code: '&#8733;' },
  { name: 'Degree', code: '&#176;' },
  { name: 'Acute', code: '&#xB4;' },
  { name: 'Aring', code: '&Aring;' },
  { name: 'Angle', code: '&#8736;' },
  { name: 'And', code: '&#8743;' },
  { name: 'Or', code: '&#8744;' },
  { name: 'Intersection', code: '&#8745;' },
  { name: 'Union', code: '&#8746;' },
  { name: 'Almost Equal', code: '&#8776;' },
  { name: 'Less Than Or Equal', code: '&#8804;' },
  { name: 'Greater Than Or Equal', code: '&#8805;' },
  { name: 'Partial Differential', code: '&#8706;' },
];

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

export const TOUR_ITEMS = 'tourItems';

export const TOUR_TYPES = {
  ADD_QUESTION: 'add-question',
  HOME: 'home',
  TEACHER_HOME: 'teacher-home',
  ADD_MEETING: 'add-meeting',
  ADD_CONTENT: 'add-content',
};

export const TOUR_CONFIGS = {
  [TOUR_TYPES.ADD_QUESTION]: [
    {
      selector: '[data-tour="question-type"]',
      content:
        "Tell us, what type of Question you want to add.  We have all types in our buffet, from single choice, multiple-choice, one word to text. Hope it's all you want.",
    },
    {
      selector: '[data-tour="function"]',
      content:
        "Once you will we adding questions, you will need this PartHub function assistant to add difficult equations, mathematical notations, or just a free flow diagram. It's meant to make the most difficult part super easy... And don't forget to add your favourites.",
    },
    {
      selector: '[data-tour="question"]',
      content: 'Here goes the question content.',
    },
    {
      selector: '[data-tour="added-question"]',
      content: 'We will keep all your work safe here.',
    },
    {
      selector: '[data-tour="publish"]',
      content:
        'Sit back and relax you are done, Just let us know whenever you want to let your students take the test.',
    },
    {
      selector: '[data-tour="paper-link"]',
      content: 'In case you wanna share the test with anybody.',
    },
    {
      selector: '[data-tour="create-pdf"]',
      content: 'If you want to create a pdf once you are done just let us know.',
    },
  ],
  [TOUR_TYPES.HOME]: [
    {
      selector: '[data-tour="schedule"]',
      content: 'Schedule a meeting or a class within a minute. It can be repetitive or one-time.',
    },
    {
      selector: '[data-tour="today-class"]',
      content:
        "Once scheduled, we will keep you posted about all your classes today. Don't miss to check it out after you schedule your first class.",
    },
    {
      selector: '[data-tour="create-paper"]',
      content:
        'Create any kind of quizzes, assignments, or tests for your students on our fluid editor. Just wish what you wanna add, we will do the heavy lifting.',
    },
    {
      selector: '[data-tour="create-content"]',
      content:
        'Add any kind of study materials for your students on our fluid editor. Just wish what you wanna add, we will do the heavy lifting.',
    },
    {
      selector: '[data-tour="workspace"]',
      content:
        "Your latest working materials would appear here. Let's continuously improve papers and study materials content for your students.",
    },
    {
      selector: '[data-tour="teacher-invite"]',
      content: "Invite a teacher for handling multiple batches. We'll create the dashboard for your teachers.",
    },
    {
      selector: '[data-tour="student-invite"]',
      content:
        'Invite a student you are teaching to any of your current batches. If no batch exits, do not worry we will create one for you.',
    },
    {
      selector: '[data-tour="my-batches"]',
      content: 'Pheewwww, here are all your batches.... Invite the Parths to explore',
    },
    {
      selector: '[data-tour="drawer"]',
      content: "Let's explore more functionalities by clicking here.",
    },
  ],
  [TOUR_TYPES.TEACHER_HOME]: [
    {
      selector: '[data-tour="schedule"]',
      content: 'Schedule a meeting or a class within a minute. It can be repetitive or one-time.',
    },
    {
      selector: '[data-tour="today-class"]',
      content:
        "Once scheduled, we will keep you posted about all your classes today. Don't miss to check it out after you schedule your first class.",
    },
    {
      selector: '[data-tour="create-paper"]',
      content:
        'Create any kind of quizzes, assignments, or tests for your students on our fluid editor. Just wish what you wanna add, we will do the heavy lifting.',
    },
    {
      selector: '[data-tour="create-content"]',
      content:
        'Add any kind of study materials for your students on our fluid editor. Just wish what you wanna add, we will do the heavy lifting.',
    },
    {
      selector: '[data-tour="workspace"]',
      content:
        "Your latest working materials would appear here. Let's continuously improve papers and study materials content for your students.",
    },
    {
      selector: '[data-tour="student-invite"]',
      content:
        'Invite a student you are teaching to any of your current batches. If no batch exits, do not worry we will create one for you.',
    },
    {
      selector: '[data-tour="my-batches"]',
      content: 'Pheewwww, here are all your batches.... Invite the Parths to explore',
    },
    {
      selector: '[data-tour="drawer"]',
      content: "Let's explore more functionalities by clicking here.",
    },
  ],
  [TOUR_TYPES.ADD_MEETING]: [
    {
      selector: '[data-tour=""]',
      content: '',
    },
    {
      selector: '[data-tour=""]',
      content: '',
    },
    {
      selector: '[data-tour=""]',
      content: '',
    },
    {
      selector: '[data-tour=""]',
      content: '',
    },
  ],
  [TOUR_TYPES.ADD_CONTENT]: [
    {
      selector: '[data-tour="content-type"]',
      content: 'You may want to add a syllabus, notes, or some references for your students for the subject. ',
    },
    {
      selector: '[data-tour="function"]',
      content:
        'From complex mathematical equations, scientific expressions to free flow diagrams, our intuitive functions will help. Even if you wish to add some images, we got you covered..... Do not forget to add favourites.',
    },
    {
      selector: '[data-tour="upload"]',
      content: 'Click here to upload pdf files for your students.',
    },
    {
      selector: '[data-tour="document-link"]',
      content: 'If you have any external links, let us know here.',
    },
    {
      selector: '[data-tour="video-link"]',
      content: 'We will also store videos for your content repository.',
    },
  ],
};

export const STANDARD_GROUP_ORDER: IDynamicObject = {
  [StandardGroup.CLASSES]: 100,
  [StandardGroup.COMPETITIVE_EXAMS]: 500,
  [StandardGroup.POST_GRADUATE_COMPETITIVE_EXAMS]: 1000,
  [StandardGroup.GATE]: 1500,
};

export const ACTIONS = 'actions';

export const ALL = 'ALL';

export const ColorTypeMap: Record<ColorType, string> = {
  [ColorType.RED]: 'text-red-primary',
  [ColorType.GREEN]: 'text-green-primary',
  [ColorType.BLUE]: 'text-blue-primary',
  [ColorType.YELLOW]: 'text-yellow-primary',
  [ColorType.ORANGE]: 'text-orange-primary',
  [ColorType.PURPLE]: 'text-purple-primary',
  [ColorType.PINK]: 'text-pink-primary',
  [ColorType.VIOLET]: 'text-violet-primary',
  [ColorType.GREY]: 'text-grey-primary',
};

export const BgColorTypeMap: Record<ColorType, string> = {
  [ColorType.RED]: 'bg-red-primary',
  [ColorType.GREEN]: 'bg-green-primary',
  [ColorType.BLUE]: 'bg-blue-primary',
  [ColorType.YELLOW]: 'bg-yellow-primary',
  [ColorType.ORANGE]: 'bg-orange-primary',
  [ColorType.PURPLE]: 'bg-purple-primary',
  [ColorType.PINK]: 'bg-pink-primary',
  [ColorType.VIOLET]: 'bg-violet-primary',
  [ColorType.GREY]: 'bg-grey-primary',
};

export const AccountSettingsRoutes: Record<AccountSettingsType, string> = {
  [AccountSettingsType.ACCOUNT_SETTINGS]: '/account-settings',
  [AccountSettingsType.PROFILE]: '/account-settings/profile',
  [AccountSettingsType.SECURITY]: '/account-settings/security',
};
