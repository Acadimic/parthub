import { type LevelType } from '../enums';

/**
 * The JSON a model returns for the study material generator, and the importer reads.
 *
 * One file is a graded set of lessons for a chapter or a subject — easy first, then medium, then
 * hard — closed by an exam-preparation sheet of key terms, concepts, formulas and pitfalls. Content
 * is Markdown with LaTeX, as for test papers. Resources are real, reachable web pages, videos and
 * PDFs the model found while researching; the importer checks each address before it is stored.
 */
export const AI_STUDY_MATERIAL_FORMAT = 'acadimic.study-material/v1';

export type AiResourceKind = 'video' | 'article' | 'pdf';

export type AiMaterialKind = 'lesson' | 'examPrep';

export interface IAiResource {
  kind: AiResourceKind;
  title: string;
  url: string;
  /** Who publishes it, e.g. "Khan Academy", "NCERT", "MIT OpenCourseWare". */
  source?: string;
  /** One line on what it adds and where in the lesson it belongs. */
  note?: string;
}

export interface IAiKeyTerm {
  term: string;
  /** One or two plain sentences. */
  definition: string;
}

export interface IAiMaterial {
  /** Unique within the file, e.g. "M1". Used only to point at a lesson in an error message. */
  ref: string;
  kind: AiMaterialKind;
  name: string;
  level: LevelType;
  /** A short snake_case topic, e.g. "newtons_laws". */
  tag: string;
  /** How long a student needs to work through it. */
  durationMins: number;
  /** Id from the workspace; absent when the set covers the whole subject. */
  chapter?: string;
  /** The topics this lesson covers, in the order they appear. Shown in the preview. */
  topics?: string[];
  /** Markdown. */
  content: string;
  /** The lesson's vocabulary, also written into the content as its "Key terms" section. */
  keyTerms?: IAiKeyTerm[];
  resources?: IAiResource[];
}

export interface IAiStudyMaterial {
  format: typeof AI_STUDY_MATERIAL_FORMAT;
  standard: string;
  subject: string;
  /** What the model was asked for, echoed back so a file can be understood without its prompt. */
  title?: string;
  generatedBy?: string;
  /** The syllabus the model worked from, one line per topic, in teaching order. Shown in the preview. */
  outline?: string[];
  /** Set when the model split a long reply: part 1 of 2, and so on. The importer merges the parts. */
  part?: { index: number; total: number };
  materials: IAiMaterial[];
}
