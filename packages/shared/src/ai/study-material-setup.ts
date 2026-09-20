import { type ChapterDto } from '../contracts';
import { type AiResourceKind } from '../interfaces';
import { LevelType } from '../enums';
import { EXAM_STYLES, LANGUAGES } from './test-paper-generator';

/** What the teacher decides; everything else the prompt settles. */
export interface IAiMaterialSetup {
  /** Empty means the whole subject. */
  chapterIds: string[];
  lessonCount: number;
  examStyle: string;
  language: string;
  includeVideos: boolean;
  includeArticles: boolean;
  includePdfs: boolean;
  includeExamPrep: boolean;
  instructions: string;
  /**
   * An explicit lesson list, from a course plan. Replaces the ladder: the model writes exactly
   * these lessons with these refs, and the reply echoes `courseModule` so the import can link them.
   */
  lessons?: IAiPlannedLesson[];
  courseModule?: { id: string; name: string; description?: string };
}

/** One lesson a course plan asked for, with the ref the reply must use. */
export interface IAiPlannedLesson {
  ref: string;
  name: string;
  level: LevelType;
  topics: string[];
  durationMins: number;
  chapter?: string;
}

export interface IAiMaterialContext {
  standard: { _id: string; name: string };
  subject: { _id: string; name: string };
  chapters: ChapterDto[];
}

export const MATERIAL_DEFAULTS = {
  lessonCount: 5,
  minLessons: 2,
  maxLessons: 20,
  /** A whole subject needs more rungs on the ladder than a chapter. */
  wholeSubjectLessons: 10,
  /** Above this many lessons the model is told it may answer in parts. */
  partThreshold: 8,
} as const;

export const DEFAULT_MATERIAL_SETUP: IAiMaterialSetup = {
  chapterIds: [],
  lessonCount: MATERIAL_DEFAULTS.lessonCount,
  examStyle: EXAM_STYLES[0],
  language: LANGUAGES[0],
  includeVideos: true,
  includeArticles: true,
  includePdfs: true,
  includeExamPrep: true,
  instructions: '',
};

/** Roughly two-fifths easy, two-fifths medium, the rest hard — a ladder, never a cliff. */
export const levelLadder = (count: number): LevelType[] => {
  const easy = Math.max(1, Math.round(count * 0.4));
  const medium = Math.max(count > 2 ? 1 : 0, Math.round(count * 0.4));
  const hard = Math.max(0, count - easy - medium);
  return [
    ...Array<LevelType>(easy).fill(LevelType.EASY),
    ...Array<LevelType>(medium).fill(LevelType.MEDIUM),
    ...Array<LevelType>(hard).fill(LevelType.HARD),
  ].slice(0, count);
};

export const resourceKinds = (setup: IAiMaterialSetup): AiResourceKind[] =>
  [setup.includeVideos && 'video', setup.includeArticles && 'article', setup.includePdfs && 'pdf'].filter(
    (kind): kind is AiResourceKind => !!kind,
  );
