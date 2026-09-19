import { type LevelType, type QuestionType } from '../enums';

/**
 * The JSON a model returns for the test paper generator, and the importer reads.
 *
 * Content is Markdown with LaTeX (`$…$`, `$$…$$`), not the editor's document JSON: a model writes
 * Markdown reliably and the importer already turns it into editable content. Ids the workspace
 * owns — paper, sections, standard, subject, chapter — are carried through so the import needs no
 * matching by name.
 */
export const AI_TEST_PAPER_FORMAT = 'acadimic.test-paper/v1';

export interface IAiQuestionOption {
  /** Markdown. */
  body: string;
  isCorrect: boolean;
}

export interface IAiQuestionMarks {
  correct: number;
  incorrect: number;
  unattempted: number;
}

export interface IAiQuestion {
  /** Unique within the file, e.g. "S1-Q3". Used only to point at a question in an error message. */
  ref: string;
  questionType: QuestionType;
  /** Markdown. */
  body: string;
  /** Choice and boolean questions only. */
  options?: IAiQuestionOption[];
  /** Integer, fill-in-the-blank and subjective questions: the expected answer, in Markdown. */
  answer?: string;
  /** Markdown; the worked solution shown to a student after the attempt. */
  solution?: string;
  /** Absent means the section's default marks for this type apply. */
  marks?: IAiQuestionMarks;
  level: LevelType;
  /** A short snake_case topic, e.g. "projectile_motion". */
  tag: string;
  /** Ids from the workspace. `chapter` is optional; the others default to the paper's. */
  standard?: string;
  subject?: string;
  chapter?: string;
  /** Extra insight the importer keeps out of the database but shows in the preview. */
  estimatedMinutes?: number;
  skills?: string[];
}

export interface IAiSection {
  /** Unique within the file, e.g. "S1". */
  ref: string;
  /** Set when the questions go into an existing section; absent when the importer should create one. */
  sectionId?: string;
  name: string;
  /** Markdown shown to students at the top of the section. */
  instructions?: string;
  questions: IAiQuestion[];
}

export interface IAiTestPaper {
  format: typeof AI_TEST_PAPER_FORMAT;
  testPaperId: string;
  /** What the model was asked for, echoed back so a file can be understood without its prompt. */
  title?: string;
  generatedBy?: string;
  sections: IAiSection[];
}
