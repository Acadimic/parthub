import { type IPrintQuiz, PrintClosing, PrintSheet, PrintShell, PrintTestPaper } from '@repo/ui/print';
import { BlankState } from '@components/others';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { buildEyebrow, closePrintTab, loadEnrolledCourse, loadQuizzes, readQuiz, toErrorMessage } from './print-data';

interface IProps {
  courseId: string;
  testPaperId: string;
}

interface ISnapshot {
  quiz: IPrintQuiz;
  eyebrow: string;
}

/** Read through its course, so a quiz in another organization's published course prints too. */
const loadQuiz = async (courseId: string, testPaperId: string): Promise<ISnapshot> => {
  const { course, modules } = await loadEnrolledCourse(courseId);
  if (!modules.some((row) => row.testPapers?.includes(testPaperId))) {
    throw new Error('This quiz is not part of the course, or was removed.');
  }
  await loadQuizzes([testPaperId]);
  const quiz = readQuiz(testPaperId);
  if (!quiz) throw new Error('This quiz could not be loaded.');
  const reveals = quiz.solutions === 'shown' ? 'Quiz · With answers and solutions' : 'Quiz · With answers';
  return { quiz, eyebrow: buildEyebrow(reveals, course) };
};

/** One quiz from a course: a question paper until the learner submits it, then with its answers. */
export const QuizPrint = ({ courseId, testPaperId }: IProps) => {
  const { push } = useRouter();
  const [snapshot, setSnapshot] = useState<ISnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId || !testPaperId) return;
    loadQuiz(courseId, testPaperId)
      .then(setSnapshot)
      .catch((reason: unknown) => setError(toErrorMessage(reason)));
  }, [courseId, testPaperId]);

  if (error) return <BlankState label="Could not print this quiz" description={error} className="py-24" />;

  const name = snapshot?.quiz.paper.paper.name ?? 'Quiz';
  return (
    <PrintShell
      documentTitle={name}
      footer={name}
      isLoaded={!!snapshot}
      onClose={() => closePrintTab(() => push(`/courses/${courseId}/modules`))}
      controls={
        <span className="text-xs text-muted-foreground">
          {snapshot?.quiz.solutions === 'shown'
            ? 'You have submitted this quiz, so it prints with its solutions.'
            : 'Prints with the answers. Submit this quiz to print the solutions too.'}
        </span>
      }
    >
      {snapshot ? (
        <PrintSheet isNewPage={false}>
          <PrintTestPaper
            paper={snapshot.quiz.paper}
            version={snapshot.quiz.version}
            solutions={snapshot.quiz.solutions}
            eyebrow={snapshot.eyebrow}
            placement="standalone"
            sitting={null}
          />
          <PrintClosing />
        </PrintSheet>
      ) : null}
    </PrintShell>
  );
};
