import { Button, Tooltip } from '@repo/ui/app';
import { TopicPicker } from '@components/tools';
import { useLessonReader } from '@hooks/lesson-reader.hook';
import { CaretLeftIcon, CaretRightIcon, CaretUpIcon } from '@phosphor-icons/react';
import { type IMaterial } from '@stores';
import { getLessonPageTitle } from '@utils/helpers';

/**
 * The reader's slim bar under the page, set like the exam footer: Previous on the left, the page
 * in hand opening the path of pages in the middle, Next on the right. Past either end it moves to
 * the neighbouring lesson. Nothing in the full view, whose toggle sits in the progress strip.
 */
export const TopicPager = ({ material }: { material: IMaterial }) => {
  const {
    isReader,
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
  if (!isReader || !page) return null;

  return (
    <div>
      <div className="flex items-center gap-2 px-2 py-1 md:px-3">
        <Tooltip title={previousLabel}>
          <Button
            isSecondary
            aria-label={previousLabel}
            disabled={isPreviousDisabled}
            className="h-8 shrink-0 px-2.5 text-xs sm:px-3"
            labelClassName="hidden sm:block"
            onClick={goPrevious}
            leftsection={<CaretLeftIcon weight="bold" className="h-3.5 w-3.5" />}
          >
            Previous
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
              className="h-8 min-w-0 max-w-full px-2.5 hover:bg-muted [&>div]:min-w-0"
              labelClassName="min-w-0 truncate"
              rightsection={<CaretUpIcon weight="bold" className="h-3 w-3 text-muted-foreground" />}
            >
              <span className="rounded-full bg-primary/10 px-1.5 py-px font-mono text-xxs font-semibold text-primary">
                {pageIndex + 1}/{pages.length}
              </span>
              <span className="ml-2 text-xs font-semibold">{getLessonPageTitle(page, material.name)}</span>
            </Button>
          }
        />
        <Tooltip title={nextLabel}>
          <Button
            isSecondary={isNextDisabled}
            aria-label={nextLabel}
            disabled={isNextDisabled}
            className="h-8 shrink-0 px-2.5 text-xs sm:px-3"
            labelClassName="hidden sm:block"
            onClick={goNext}
            rightsection={<CaretRightIcon weight="bold" className="h-3.5 w-3.5" />}
          >
            {isLastPage ? 'Next lesson' : 'Next'}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};
