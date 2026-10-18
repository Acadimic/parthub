import { Button, FullScreenModal, Spinner, ToggleTheme, Tooltip } from '@repo/ui/app';
import { PrintCourse } from '@repo/ui/print';
import { BlankState } from '@components/others';
import { type IPrintCourseSnapshot, loadPrintCourse, toErrorMessage } from '@modules/print/print-data';
import { BookOpenTextIcon, PrinterIcon, XIcon } from '@phosphor-icons/react';
import { type ICourse, useSelectorLookups } from '@stores';
import { closeCourseBook } from '@utils/course-book';
import { getPlural } from '@utils/helpers';
import { useEffect, useState } from 'react';

/** What the book holds, under its title: "12 modules · 40 lessons · 8 quizzes". */
const describe = ({ data }: IPrintCourseSnapshot) => {
  const lessons = data.modules.reduce((sum, item) => sum + item.materials.length, 0);
  const quizzes = data.modules.reduce((sum, item) => sum + item.quizzes.length, 0);
  return [
    `${data.modules.length} ${getPlural(data.modules.length, 'module')}`,
    `${lessons} ${getPlural(lessons, 'lesson')}`,
    `${quizzes} ${getPlural(quizzes, 'quiz')}`,
  ].join(' · ');
};

/**
 * The whole course read as pages in a modal over the learning view: the same cover, contents and
 * module pages as the printout, in the app's own theme and with its content live rather than
 * stilled for paper. The lesson bodies load when it opens, and go when it closes, so a long course
 * is not held in memory while the learner reads a lesson at a time.
 */
export const CourseBook = ({ course }: { course: ICourse }) => {
  const { isCourseBookOpen } = useSelectorLookups();
  const [snapshot, setSnapshot] = useState<IPrintCourseSnapshot | null>(null);
  const [error, setError] = useState('');
  const close = closeCourseBook;

  // Leaving the browser's full screen by its own means (Escape, its control) closes the book.
  useEffect(() => {
    if (!isCourseBookOpen) return undefined;
    const onChange = () => !document.fullscreenElement && closeCourseBook();
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [isCourseBookOpen]);

  useEffect(() => {
    if (!isCourseBookOpen) {
      setSnapshot(null);
      setError('');
      return undefined;
    }
    let isCurrent = true;
    loadPrintCourse(course._id, null)
      .then((loaded) => isCurrent && setSnapshot(loaded))
      .catch((reason: unknown) => isCurrent && setError(toErrorMessage(reason)));
    return () => {
      isCurrent = false;
    };
  }, [isCourseBookOpen, course._id]);

  return (
    <FullScreenModal
      isOpen={isCourseBookOpen}
      onClose={close}
      component={
        <div className="flex h-full w-full flex-col bg-muted">
          <div className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-3 py-2 md:px-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpenTextIcon weight="duotone" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{course.name}</div>
              <div className="truncate font-mono text-xxs text-muted-foreground">
                {snapshot ? describe(snapshot) : 'Whole course'}
              </div>
            </div>
            <Tooltip title="Open the printout in a new tab">
              <Button
                isSecondary
                isRound
                className="h-9 px-3"
                labelClassName="hidden sm:block"
                onClick={() => window.open(`/courses/${course._id}/print`, '_blank')}
                leftsection={<PrinterIcon weight="bold" className="h-4 w-4" />}
              >
                Print / Save PDF
              </Button>
            </Tooltip>
            {/* The pages take the app's theme, so the switch sits where the reader is looking. */}
            <Tooltip title="Light or dark">
              <ToggleTheme />
            </Tooltip>
            <Tooltip title="Close">
              <Button
                isRound
                isSubtle
                aria-label="Close the course book"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                onClick={close}
                leftsection={<XIcon weight="bold" className="h-5 w-5" />}
              />
            </Tooltip>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {error ? <BlankState label="Could not open the course" description={error} className="py-24" /> : null}
            {!error && !snapshot ? (
              <div className="mt-24 flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
                <Spinner className="h-8 w-8" />
                <p>Opening the whole course…</p>
                <p className="text-xs">A long course can take a little while.</p>
              </div>
            ) : null}
            {snapshot ? (
              <div className="mx-auto flex max-w-[210mm] flex-col gap-8 px-4 py-8 text-[10.5pt] leading-[1.55] max-sm:gap-4 max-sm:px-2 max-sm:py-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden">
                <PrintCourse data={snapshot.data} eyebrow={snapshot.eyebrow} scope="course" surface="screen" />
              </div>
            ) : null}
          </div>
        </div>
      }
    />
  );
};
