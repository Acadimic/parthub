import { cn } from '@repo/ui/lib';
import { type ILessonPage } from '@interfaces';
import { CheckCircleIcon } from '@phosphor-icons/react';
import { type IMaterial, useCourseLookups } from '@stores';

interface IProps {
  material: IMaterial;
  pages: ILessonPage[];
  pageIndex: number;
  onPick: (index: number) => void;
}

/**
 * One segment per page along the top of the reader, as a story's progress strip: filled once
 * opened, bright on the page in hand, and a tap on any segment jumps to it. The count of what is
 * left sits at its end, so the finish line is always in view.
 */
export const ReaderProgress = ({ material, pages, pageIndex, onPick }: IProps) => {
  const { isLessonPageViewed } = useCourseLookups();
  const remaining = pages.filter((page) => !isLessonPageViewed(material._id, page.key)).length;

  return (
    <div className="flex items-center gap-3 border-b border-border bg-background/95 px-3 py-2 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-1" role="group" aria-label="Topics">
        {pages.map((page, index) => {
          const isViewed = isLessonPageViewed(material._id, page.key);
          const isCurrent = index === pageIndex;
          return (
            // A native title rather than the Tooltip: its wrapping span would take the segment's flex width.
            <button
              key={page.key}
              type="button"
              aria-current={isCurrent || undefined}
              aria-label={`Topic ${index + 1}: ${page.title || material.name}`}
              title={page.title || material.name}
              className="group flex h-5 min-w-0 flex-1 items-center"
              onClick={() => onPick(index)}
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
