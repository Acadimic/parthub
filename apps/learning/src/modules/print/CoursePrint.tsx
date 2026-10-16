import { PrintCourse, PrintShell } from '@repo/ui/print';
import { BlankState } from '@components/others';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { closePrintTab, type IPrintCourseSnapshot, loadPrintCourse, toErrorMessage } from './print-data';

interface IProps {
  courseId: string;
  /** One module to print on its own, or null for the whole course. */
  moduleId: string | null;
}

/** A course the learner can open, or one module of it, as a printout. */
export const CoursePrint = ({ courseId, moduleId }: IProps) => {
  const { push } = useRouter();
  const [snapshot, setSnapshot] = useState<IPrintCourseSnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) return;
    loadPrintCourse(courseId, moduleId)
      .then(setSnapshot)
      .catch((reason: unknown) => setError(toErrorMessage(reason)));
  }, [courseId, moduleId]);

  if (error) return <BlankState label="Could not print this" description={error} className="py-24" />;

  const title = snapshot?.title ?? 'Course';
  return (
    <PrintShell
      documentTitle={title}
      footer={title}
      isLoaded={!!snapshot}
      onClose={() => closePrintTab(() => push(`/courses/${courseId}/modules`))}
      controls={
        <span className="text-xs text-muted-foreground">
          Quizzes print with their answers; solutions print for the ones you have submitted.
        </span>
      }
    >
      {snapshot ? (
        <PrintCourse
          data={snapshot.data}
          eyebrow={snapshot.eyebrow}
          scope={moduleId ? 'module' : 'course'}
          surface="print"
        />
      ) : null}
    </PrintShell>
  );
};
