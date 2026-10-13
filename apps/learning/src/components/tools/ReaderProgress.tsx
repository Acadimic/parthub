import { cn } from '@repo/ui/lib';
import { LessonViewMode } from '@enums';
import { useLessonReader } from '@hooks/lesson-reader.hook';
import { CheckCircleIcon } from '@phosphor-icons/react';
import { type IMaterial, useCourseLookups, useSelectorLookups } from '@stores';
import { LessonViewToggle } from './LessonViewToggle';

/**
 * The strip along the top of the lesson, in both views: the view toggle, then one segment per
 * page as a story's progress strip — filled once opened, bright on the page in hand — and the
 * count of what is left, so the finish line is always in view. A tap on a segment jumps to its
 * page, switching to topics first when the whole lesson was showing.
 */
export const ReaderProgress = ({ material }: { material: IMaterial }) => {
  const { isReader, pages, pageIndex, goToPage } = useLessonReader(material);
  const { isLessonPageViewed } = useCourseLookups();
  const { setLessonViewMode } = useSelectorLookups();
  const remaining = pages.filter((page) => !isLessonPageViewed(material._id, page.key)).length;

  const pick = (index: number) => {
    if (!isReader) setLessonViewMode(LessonViewMode.READER);
    goToPage(index);
  };

  // Nothing to read: the toggle alone, rather than a strip that is "all read" because it is empty.
  if (!pages.length) {
    return (
      <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-2 py-1 md:px-3">
        <LessonViewToggle />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-2 py-1 md:px-3">
      <LessonViewToggle />
      <div className="h-4 w-px shrink-0 bg-border" />
      <div className="flex min-w-0 flex-1 items-center gap-1" role="group" aria-label="Topics">
        {pages.map((page, index) => {
          const isViewed = isLessonPageViewed(material._id, page.key);
          const isCurrent = isReader && index === pageIndex;
          return (
            // A native title rather than the Tooltip: its wrapping span would take the segment's flex width.
            <button
              key={page.key}
              type="button"
              aria-current={isCurrent || undefined}
              aria-label={`Topic ${index + 1}: ${page.title || material.name}`}
              title={page.title || material.name}
              className="group flex h-5 min-w-0 flex-1 items-center"
              onClick={() => pick(index)}
            >
              <span
                className={cn(
                  'h-1.5 w-full rounded-full transition-all duration-250',
                  isCurrent && 'h-2.5 bg-primary shadow-[0_0_0_3px] shadow-primary/20',
                  !isCurrent && isViewed && 'bg-primary/70 group-hover:bg-primary',
                  !isCurrent && !isViewed && 'bg-border group-hover:bg-muted-foreground/40',
                )}
              />
            </button>
          );
        })}
      </div>
      {remaining ? (
        <span className="shrink-0 font-mono text-xxs text-muted-foreground">{remaining} left</span>
      ) : (
        <span className="flex shrink-0 items-center gap-1 text-xxs font-semibold text-success animate-pop-in">
          <CheckCircleIcon weight="fill" className="h-3.5 w-3.5" />
          All read
        </span>
      )}
    </div>
  );
};
