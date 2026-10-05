import {
  type IPrintQuiz,
  type IPrintSitting,
  PrintClosing,
  PrintSheet,
  PrintShell,
  PrintTestPaper,
} from '@repo/ui/print';
import { BlankState } from '@components/others';
import { Marking } from '@enums';
import { useTestPaperStore } from '@stores';
import { getStringFormattedDate } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  buildEyebrow,
  closePrintTab,
  getPrintCourseUrl,
  loadEnrolledCourse,
  loadQuizzes,
  readQuiz,
  toErrorMessage,
} from './print-data';
import { fromSavedResult, type ISittingHandoff, readHandedOffSitting } from './sitting-handoff';

interface IProps {
  courseId: string;
  sittingId: string;
}

interface ISnapshot {
  quiz: IPrintQuiz;
  sitting: IPrintSitting;
  eyebrow: string;
  courseUrl: string | null;
}

const toSitting = (handoff: ISittingHandoff, questionIds: string[]): IPrintSitting => ({
  responses: Object.fromEntries(
    questionIds.map((questionId) => [
      questionId,
      { given: handoff.responses[questionId] ?? [], result: handoff.results[questionId] ?? Marking.UNATTEMPTED },
    ]),
  ),
  marksObtained: handoff.marksObtained,
  maxMarks: handoff.maxMarks,
  kind: handoff.isPractice ? 'practice' : 'test',
  submittedOn: handoff.at ? getStringFormattedDate(handoff.at) : '',
});

/**
 * The sitting the result screen handed over, or the saved one when the link is opened later. Read
 * through its course, so a paper from another organization's course prints too.
 */
const loadResult = async (courseId: string, sittingId: string): Promise<ISnapshot> => {
  const { course, modules } = await loadEnrolledCourse(courseId);
  const saved = useTestPaperStore.getState().resultMap[sittingId];
  const handoff = readHandedOffSitting(sittingId) ?? (saved ? fromSavedResult(saved) : null);
  if (!handoff) throw new Error('Open this from the result screen, or wait until your result has saved.');
  if (!modules.some((module) => module.testPapers?.includes(handoff.testPaper))) {
    throw new Error('This result belongs to a quiz that is no longer in the course.');
  }
  await loadQuizzes([handoff.testPaper]);
  const quiz = readQuiz(handoff.testPaper);
  if (!quiz) throw new Error('This quiz could not be loaded.');
  const sitting = toSitting(
    handoff,
    quiz.paper.questions.map((question) => question._id),
  );
  const kind = sitting.kind === 'practice' ? 'Practice result' : 'Test result';
  const when = sitting.submittedOn ? ` · ${sitting.submittedOn}` : '';
  return {
    // A finished sitting has already revealed every answer and solution on the result screen.
    quiz: { ...quiz, version: 'answers', solutions: 'shown' },
    sitting,
    eyebrow: `${buildEyebrow(kind, course)}${when}`,
    courseUrl: getPrintCourseUrl(course),
  };
};

/** A finished sitting, test or practice: the paper with the learner's answers marked against the right ones. */
export const ResultPrint = ({ courseId, sittingId }: IProps) => {
  const { push } = useRouter();
  const [snapshot, setSnapshot] = useState<ISnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId || !sittingId) return;
    loadResult(courseId, sittingId)
      .then(setSnapshot)
      .catch((reason: unknown) => setError(toErrorMessage(reason)));
  }, [courseId, sittingId]);

  if (error) return <BlankState label="Could not print this result" description={error} className="py-24" />;

  const name = snapshot ? `${snapshot.quiz.paper.paper.name} · Your answers` : 'Your answers';
  return (
    <PrintShell
      documentTitle={name}
      footer={name}
      isLoaded={!!snapshot}
      onClose={() => closePrintTab(() => push(`/courses/${courseId}/modules`))}
      controls={
        <span className="text-xs text-muted-foreground">
          Your answers, marked against the correct ones, with every solution.
        </span>
      }
    >
      {snapshot ? (
        <PrintSheet isNewPage={false}>
          <PrintTestPaper
            paper={snapshot.quiz.paper}
            version="answers"
            solutions="shown"
            eyebrow={snapshot.eyebrow}
            placement="standalone"
            sitting={snapshot.sitting}
          />
          <PrintClosing courseUrl={snapshot.courseUrl} />
        </PrintSheet>
      ) : null}
    </PrintShell>
  );
};
