import type { Marking } from '@repo/shared/enums';
import type {
  CourseDto,
  CourseModuleDto,
  MaterialDto,
  QuestionDto,
  TestPaperDto,
  TestPaperSectionDto,
} from '@repo/shared/contracts';

/**
 * Which version of a paper is printed. `questions` is what a student sits and reveals no answer
 * anywhere; `answers` marks the correct options and adds each solution; `key` is the compact table.
 */
export type PrintVersion = 'questions' | 'answers' | 'key';

/**
 * Whether the `answers` version also prints each worked solution. A teacher always gets them; a
 * learner gets the correct answers at once and the solutions only after submitting the quiz.
 */
export type PrintSolutions = 'shown' | 'hidden';

/** The fields a printout reads. Picked, so each app's store rows satisfy them as they are. */
export type IPrintQuestion = Pick<
  QuestionDto,
  '_id' | 'body' | 'questionType' | 'options' | 'solution' | 'markings' | 'order' | 'section'
>;
export type IPrintSection = Pick<TestPaperSectionDto, '_id' | 'name' | 'instruction'>;
export type IPrintPaperFields = Pick<TestPaperDto, '_id' | 'name' | 'instruction' | 'durationMins' | 'maxMarks'>;
export type IPrintMaterial = Pick<MaterialDto, '_id' | 'name' | 'content' | 'type' | 'url' | 'durationMins'>;
/** The learning store clears a removed description to `null`, so both absences are accepted. */
export interface IPrintModuleFields extends Pick<CourseModuleDto, '_id' | 'name' | 'day' | 'week'> {
  description?: string | null;
}
export type IPrintCourseFields = Pick<CourseDto, '_id' | 'name' | 'description' | 'thumbnail' | 'outcomes'>;

/** A paper with everything it prints: its sections in paper order, and every question in them. */
export interface IPrintPaper {
  paper: IPrintPaperFields;
  sections: IPrintSection[];
  questions: IPrintQuestion[];
}

/** A quiz inside a course. A course quiz prints as a question paper or with its answers, never as a key. */
export interface IPrintQuiz {
  paper: IPrintPaper;
  version: Exclude<PrintVersion, 'key'>;
  solutions: PrintSolutions;
}

export interface IPrintModule {
  module: IPrintModuleFields;
  /** 1-based position in the course, kept when a single module is printed on its own. */
  number: number;
  materials: IPrintMaterial[];
  quizzes: IPrintQuiz[];
}

export interface IPrintCourse {
  course: IPrintCourseFields;
  /** In course order. */
  modules: IPrintModule[];
}

/** How a learner answered one question in a sitting. */
export interface IPrintResponse {
  /** The option ids picked, or for a typed answer the text as the only entry. */
  given: string[];
  result: Marking;
}

/** One submitted sitting of a paper, printed with the learner's own answers beside the right ones. */
export interface IPrintSitting {
  responses: Record<string, IPrintResponse>;
  marksObtained: number;
  maxMarks: number;
  /** Practice shows each answer as it goes; a test is timed and scored at the end. */
  kind: 'test' | 'practice';
  /** When it was submitted, formatted for the page. */
  submittedOn: string;
}
