import { Button, Tooltip } from '@repo/ui/app';
import { TopicPicker } from '@components/tools';
import { useLessonMoves } from '@hooks/lesson-reader.hook';
import { CaretLeftIcon, CaretRightIcon, CaretUpIcon } from '@phosphor-icons/react';
import { type IMaterial } from '@stores';
import { getItemName, getLessonPageTitle } from '@utils/helpers';

/**
 * The one Previous and Next under the lesson, on their own line: Previous at the left, Next at the
 * right, and between them the topic in hand opening the path of topics. In the topic reader a
 * move is one topic; in the full view, and for a test, it is one lesson, with the position in the
 * course in the middle instead. Next names what it lands on, so after a topic or a lesson the
 * way on is one click without a glance up.
 */
export const LessonPager = ({ material }: { material: IMaterial | undefined }) => {
  const {
    reader,
    isTopicWise,
    forwardTarget,
    nextPage,
    previousLabel,
    nextLabel,
    isPreviousDisabled,
    isNextDisabled,
    goBack,
    goForward,
  } = useLessonMoves(material);
  const { page, pages, pageIndex, itemIndex, itemCount, goToPage } = reader;

  const getNextName = () => {
    if (nextPage && material) return getLessonPageTitle(nextPage, material.name);
    return forwardTarget ? getItemName(forwardTarget) : '';
  };
  const nextName = getNextName();
  // What the hand-over is called when Next leaves the lesson: the item kind, not "lesson" for a test.
  const getNextKicker = () => {
    if (!isTopicWise || nextPage) return 'Next';
    return forwardTarget?.testPaper ? 'Next test' : 'Next lesson';
  };
  const nextKicker = getNextKicker();

  return (
    <div className="flex items-center gap-1.5 border-t border-border px-2 py-1.5 md:px-3">
      <Tooltip title={previousLabel}>
        <Button
          isSecondary
          isRound
          disabled={isPreviousDisabled}
          aria-label={previousLabel}
          className="h-8 shrink-0 px-2.5 text-xs"
          labelClassName="hidden md:block"
          onClick={goBack}
          leftsection={<CaretLeftIcon weight="bold" className="h-3.5 w-3.5" />}
        >
          Previous
        </Button>
      </Tooltip>

      {isTopicWise && page && material ? (
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
              rightsection={<CaretUpIcon weight="bold" className="h-3 w-3 shrink-0 text-muted-foreground" />}
            >
              <span className="rounded-full bg-primary/10 px-1.5 py-px font-mono text-xxs font-semibold text-primary">
                {pageIndex + 1}/{pages.length}
              </span>
              <span className="ml-2 hidden text-xs font-semibold sm:inline">
                {getLessonPageTitle(page, material.name)}
              </span>
            </Button>
          }
        />
      ) : (
        <span className="flex min-w-0 flex-1 items-center justify-center gap-2 px-1 text-xs">
          <span className="rounded-full bg-primary/10 px-1.5 py-px font-mono text-xxs font-semibold text-primary">
            {itemIndex + 1}/{itemCount}
          </span>
          <span className="hidden text-muted-foreground sm:inline">in this course</span>
        </span>
      )}

      <Tooltip title={nextLabel}>
        <Button
          isRound
          disabled={isNextDisabled}
          aria-label={nextLabel}
          className="h-8 min-w-0 max-w-[15rem] shrink-0 pl-3.5 pr-2.5 shadow-sm shadow-primary/20 [&>div]:min-w-0"
          labelClassName="min-w-0 truncate"
          onClick={goForward}
          rightsection={<CaretRightIcon weight="bold" className="h-3.5 w-3.5" />}
        >
          {isNextDisabled ? (
            <span className="text-xs font-semibold">End of course</span>
          ) : (
            <>
              <span className="text-xxs font-semibold uppercase tracking-caps opacity-80">{nextKicker}</span>
              <span className="mx-1 hidden opacity-50 sm:inline">·</span>
              <span className="hidden text-xs font-semibold sm:inline">{nextName}</span>
            </>
          )}
        </Button>
      </Tooltip>
    </div>
  );
};
