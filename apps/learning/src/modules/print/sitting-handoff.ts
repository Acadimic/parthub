import { type TestPaperResultDto } from '@repo/shared/contracts';
import { type IExam } from '@stores';

/**
 * A sitting as the print page needs it. The result screen hands it over through localStorage, the
 * one store a new tab shares: a practice sitting is never saved, and a test may still be saving.
 */
export interface ISittingHandoff {
  testPaper: string;
  isPractice: boolean;
  responses: IExam['responseMaps'];
  results: IExam['resultMaps'];
  marksObtained: number;
  maxMarks: number;
  /** ISO time it was printed or submitted. */
  at: string;
}

const keyOf = (sittingId: string) => `print-sitting:${sittingId}`;

/** Leaves the sitting on screen for the print tab it is about to open. */
export const handOffSitting = (exam: IExam, marksObtained: number) => {
  const sitting: ISittingHandoff = {
    testPaper: exam.testPaper,
    isPractice: exam.isPractice,
    responses: exam.responseMaps,
    results: exam.resultMaps,
    marksObtained,
    maxMarks: exam.maxMarks,
    at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(keyOf(exam._id), JSON.stringify(sitting));
  } catch {
    // Storage is full or blocked; the print page then falls back to the saved result, if any.
  }
};

const isHandoff = (value: unknown): value is ISittingHandoff =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ISittingHandoff).testPaper === 'string' &&
  typeof (value as ISittingHandoff).responses === 'object' &&
  typeof (value as ISittingHandoff).results === 'object';

/** The sitting the result screen handed over, or null when this tab was opened some other way. */
export const readHandedOffSitting = (sittingId: string): ISittingHandoff | null => {
  try {
    const raw = localStorage.getItem(keyOf(sittingId));
    const value: unknown = raw ? JSON.parse(raw) : null;
    return isHandoff(value) ? value : null;
  } catch {
    return null;
  }
};

/** A saved result in the same shape, for a link opened after the result screen is gone. */
export const fromSavedResult = (row: TestPaperResultDto): ISittingHandoff => ({
  testPaper: row.testPaper,
  isPractice: row.isPractice,
  responses: row.responseMaps,
  results: row.resultMaps,
  marksObtained: row.marksObtained,
  maxMarks: row.maxMarks,
  at: row.createdAt ?? '',
});
