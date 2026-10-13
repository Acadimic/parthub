import { Button, Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { TopicPicker } from '@components/tools';
import { useLessonReader } from '@hooks/lesson-reader.hook';
import { CaretLeftIcon, CaretRightIcon, CaretUpIcon, ConfettiIcon } from '@phosphor-icons/react';
import { type IMaterial, useCourseLookups, useSelectorLookups } from '@stores';
import { getLessonPageTitle } from '@utils/helpers';

/** The reward for the last page: every topic read, and the swipe below is now live. */
const AllReadBanner = () => (
  <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-success/15 via-primary/10 to-success/15 px-3 py-2 text-sm font-semibold text-success animate-pop-in">
    <ConfettiIcon weight="fill" className="h-5 w-5" />
    All topics read! Swipe below to complete this lesson.
  </div>
);

/**
 * The reader's game-pad under the page: back, the page in hand opening the path of pages, and a
 * forward button that glows so the next move is never in doubt. Past either end it moves to the
 * neighbouring lesson.
 */
export const TopicPager = ({ material }: { material: IMaterial }) => {
  const {
    pages,
    page,
    pageIndex,
    isLastPage,
    previousLabel,
    nextLabel,
    isPreviousDisabled,
    isNextDisabled,
    goToPage,
    goNext,
    goPrevious,
  } = useLessonReader(material);
  const { countUnviewedLessonPages, isCourseModuleItemCompleted } = useCourseLookups();
  const { selectedCourseId, selectedCourseModuleId } = useSelectorLookups();
  if (!page) return null;

  const isAllRead = !countUnviewedLessonPages(
    material._id,
    pages.map((item) => item.key),
  );
  const isCompleted = isCourseModuleItemCompleted({
    course: selectedCourseId,
    courseModule: selectedCourseModuleId,
    collectionItem: material._id,
  });

  return (
    <div className="border-t border-border">
      {isAllRead && !isCompleted ? <AllReadBanner /> : null}
      <div className="flex items-center gap-2 px-2 py-2 md:px-3">
        <Tooltip title={previousLabel}>
          <Button
            isRound
            isSecondary
            aria-label={previousLabel}
            disabled={isPreviousDisabled}
            className="h-10 w-10 shrink-0 p-0 sm:w-auto sm:px-4"
            labelClassName="hidden sm:block"
            onClick={goPrevious}
            leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
          >
            Back
          </Button>
        </Tooltip>
        <TopicPicker
          material={material}
          pages={pages}
          pageIndex={pageIndex}
          onPick={goToPage}
          triggerClassName="flex min-w-0 flex-1 justify-center"
          trigger={
            <Button
              isSubtle
              isRound
              aria-label="Choose a topic"
              className="h-10 min-w-0 max-w-full bg-muted/60 px-3 hover:bg-muted [&>div]:min-w-0"
              labelClassName="min-w-0 truncate"
              rightsection={<CaretUpIcon weight="bold" className="h-3.5 w-3.5 text-muted-foreground" />}
            >
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xxs font-semibold text-primary">
                {pageIndex + 1}/{pages.length}
              </span>
              <span className="ml-2 text-sm font-semibold">{getLessonPageTitle(page, material.name)}</span>
            </Button>
          }
        />
        <Tooltip title={nextLabel}>
          <Button
            isRound
            isSecondary={isNextDisabled}
            aria-label={nextLabel}
            disabled={isNextDisabled}
            className={cn(
              'h-10 w-10 shrink-0 p-0 sm:w-auto sm:px-4',
              !isNextDisabled && 'shadow-md shadow-primary/30 ring-2 ring-primary/20',
            )}
            labelClassName="hidden sm:block"
            onClick={goNext}
            rightsection={<CaretRightIcon weight="bold" className="h-4 w-4" />}
          >
            {isLastPage ? 'Next lesson' : 'Next'}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};
