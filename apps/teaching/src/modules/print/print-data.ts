import { type IPrintPaper, type PrintVersion } from '@repo/ui/print';
import { useQuestionStore, useStandardStore, useTestPaperStore } from '@stores';

export const VERSION_LABELS: Record<PrintVersion, string> = {
  answers: 'With answers',
  questions: 'Question paper',
  key: 'Answer key',
};

export const VERSION_OPTIONS = (Object.keys(VERSION_LABELS) as PrintVersion[]).map((value) => ({
  value,
  label: VERSION_LABELS[value],
}));

/** With answers unless the link asks for another version: a teacher prints for marking more than for sitting. */
export const toPrintVersion = (value: unknown): PrintVersion =>
  value === 'questions' || value === 'key' ? value : 'answers';

/** "Quiz · Class 11 · Physics": a kind, then the standards and subjects the row is tagged with. */
export const buildEyebrow = (kind: string, standardIds: string[], subjectIds: string[]) => {
  const { getStandardsByIds, getSubjectsByIds } = useStandardStore.getState();
  return [
    kind,
    ...getStandardsByIds(standardIds).map((row) => row.name),
    ...getSubjectsByIds(subjectIds).map((row) => row.name),
  ].join(' · ');
};

/** A loaded paper read out of the stores, or null when the paper itself is not there. */
export const readPrintPaper = (testPaperId: string): IPrintPaper | null => {
  const { getTestPaperById, getTestPaperSectionsByIds } = useTestPaperStore.getState();
  const paper = getTestPaperById(testPaperId);
  if (!paper) return null;
  const sections = getTestPaperSectionsByIds(paper.sections ?? []);
  const questions = useQuestionStore.getState().getQuestionsBySectionIds(sections.map((section) => section._id));
  return { paper, sections, questions };
};

/** The print page opens in a tab of its own, so Close closes it; opened directly, it goes back. */
export const closePrintTab = (fallback: () => void) => {
  window.close();
  fallback();
};
