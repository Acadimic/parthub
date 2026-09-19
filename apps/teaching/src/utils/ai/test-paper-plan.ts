import { type ChapterDto, type StandardDto, type SubjectDto } from '@repo/shared/contracts';
import { type DefaultMarkingType } from '@repo/shared/interfaces';
import { QuestionType } from '@enums';
import { EMPTY_COUNTS, type IAiSectionPlan, type IQuestionCounts } from './test-paper-generator';

/** What a paper generated from nothing but standards starts as. */
export const WHOLE_PAPER_DEFAULTS = { totalQuestions: 20, durationMins: 30 };

/**
 * Splits a total into the default type mix: mostly single choice, with some multiple choice and a
 * few integer answers so a paper is not a wall of one format. Rounding is settled on single choice
 * so the total is exact.
 */
export const defaultCounts = (total: number): IQuestionCounts => {
  const multipleChoice = Math.round(total * 0.15);
  const integer = Math.round(total * 0.15);
  return {
    ...EMPTY_COUNTS,
    [QuestionType.MULTIPLE_CHOICE]: multipleChoice,
    [QuestionType.INTEGER]: integer,
    [QuestionType.SINGLE_CHOICE]: Math.max(0, total - multipleChoice - integer),
  };
};

/** Shares `total` across `parts` so the parts differ by at most one and sum exactly. */
export const splitEvenly = (total: number, parts: number): number[] => {
  if (parts <= 0) return [];
  const base = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, index) => base + (index < total % parts ? 1 : 0));
};

/**
 * The sections a whole paper gets when nobody has drawn them up: one per subject, named after
 * it, each covering that subject's chapters; or a single section when the paper has one subject
 * or none chosen.
 */
export const planWholePaperSections = (
  total: number,
  subjects: SubjectDto[],
  chapters: ChapterDto[],
  defaultMarkings: DefaultMarkingType,
): IAiSectionPlan[] => {
  if (subjects.length < 2) {
    return [
      {
        key: 'auto-1',
        name: subjects[0]?.name ?? 'Section A',
        counts: defaultCounts(total),
        chapterIds: [],
        topics: '',
        defaultMarkings,
      },
    ];
  }
  const shares = splitEvenly(total, subjects.length);
  return subjects.map((subject, index) => ({
    key: `auto-${subject._id}`,
    name: subject.name,
    counts: defaultCounts(shares[index]),
    chapterIds: chapters.filter((chapter) => chapter.subject === subject._id).map((chapter) => chapter._id),
    topics: '',
    defaultMarkings,
  }));
};

/** "Class 10 - Physics, Chemistry - 2026": the same shape the create form suggests. */
export const wholePaperName = (standards: StandardDto[], subjects: SubjectDto[]): string =>
  [
    standards.map((standard) => standard.name).join(', '),
    subjects.map((subject) => subject.name).join(', '),
    String(new Date().getFullYear()),
  ]
    .filter(Boolean)
    .join(' - ');
