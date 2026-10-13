import { Button, Tooltip } from '@repo/ui/app';
import { useCourse } from '@hooks/course.hook';
import { useLessonReader } from '@hooks/lesson-reader.hook';
import { type ICourseModuleItem } from '@interfaces';
import { ArrowsInIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon } from '@phosphor-icons/react';
import { useSelectedMaterial, useSelectorLookups } from '@stores';
import { getEdgeLabel, getItemName, getLessonPageTitle } from '@utils/helpers';
import { TopicPicker } from './TopicPicker';

/**
 * The footer of a full-screen viewer: the way back out, where the learner is, and the previous
 * and next moves. In the topic reader a move is one topic, handing over to the neighbouring
 * lesson past either end; in the full view it is one lesson. A test paper has its own
 * full-screen sitting, so moving to one leaves this one first.
 */
/** The bar's two moves, their labels and whether either end has been reached. */
const useFullScreenMoves = (onExit: () => void) => {
  const { selectedCourseId } = useSelectorLookups();
  const selectedMaterial = useSelectedMaterial();
  const reader = useLessonReader(selectedMaterial);
  const { getCourseItems, getSelectedItemIndex, selectAdjacentItem } = useCourse();
  const items = selectedCourseId ? getCourseItems(selectedCourseId) : [];
  const index = selectedCourseId ? getSelectedItemIndex(selectedCourseId) : -1;
  const previous = items[index - 1];
  const next = items[index + 1];
  const isTopicWise = reader.isReader && !!reader.page;
  // Within the lesson a move is a topic; at its ends, the neighbouring item.
  const isAtStart = reader.isFirstPage;
  const isAtEnd = reader.isLastPage;
  // Item-wise, the labels are the course's edges; topic-wise, the reader already has them.
  const edges = isTopicWise
    ? reader
    : {
        previousLabel: getEdgeLabel(previous, 'Previous', 'Start of course'),
        nextLabel: getEdgeLabel(next, 'Next', 'End of course'),
        isPreviousDisabled: !previous,
        isNextDisabled: !next,
      };

  // A test paper has its own full-screen sitting, so moving to one leaves this one first.
  const goToItem = (target: ICourseModuleItem | undefined, direction: 1 | -1) => {
    if (!target || !selectedCourseId) return;
    if (target.testPaper) onExit();
    selectAdjacentItem(selectedCourseId, direction, 0);
  };

  // Topic-wise the reader makes the move, so Prev lands on the previous lesson's last topic.
  const goTopicWise = (move: () => void, edgeTarget: ICourseModuleItem | undefined, isAtEdge: boolean) => {
    if (isAtEdge && edgeTarget?.testPaper) onExit();
    move();
  };

  return {
    current: items[index],
    index,
    total: items.length,
    selectedMaterial,
    reader,
    isTopicWise,
    goBack: () => (isTopicWise ? goTopicWise(reader.goPrevious, previous, isAtStart) : goToItem(previous, -1)),
    goForward: () => (isTopicWise ? goTopicWise(reader.goNext, next, isAtEnd) : goToItem(next, 1)),
    previousLabel: edges.previousLabel,
    nextLabel: edges.nextLabel,
    isPreviousDisabled: edges.isPreviousDisabled,
    isNextDisabled: edges.isNextDisabled,
  };
};

export const FullScreenBar = ({ onExit }: { onExit: () => void }) => {
  const {
    current,
    index,
    total,
    selectedMaterial,
    reader,
    isTopicWise,
    goBack,
    goForward,
    previousLabel,
    nextLabel,
    isPreviousDisabled,
    isNextDisabled,
  } = useFullScreenMoves(onExit);

  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-t border-border bg-background px-3 md:px-4">
      <Button
        isSecondary
        isRound
        aria-label="Exit full screen"
        className="h-9 shrink-0 px-3"
        labelClassName="hidden sm:block"
        onClick={onExit}
        leftsection={<ArrowsInIcon weight="bold" className="h-4 w-4" />}
      >
        Exit full screen
      </Button>
      <div className="flex min-w-0 flex-1 justify-center">
        {isTopicWise && reader.page && selectedMaterial ? (
          <TopicPicker
            material={selectedMaterial}
            pages={reader.pages}
            pageIndex={reader.pageIndex}
            onPick={reader.goToPage}
            triggerClassName="flex min-w-0 max-w-full justify-center"
            trigger={
              <Button
                isSubtle
                isRound
                aria-label="Choose a topic"
                className="h-11 min-w-0 max-w-full px-3 hover:bg-muted [&>div]:min-w-0"
                labelClassName="min-w-0"
                rightsection={<CaretUpIcon weight="bold" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              >
                <span className="block truncate text-center text-sm font-semibold">
                  {getLessonPageTitle(reader.page, selectedMaterial.name)}
                </span>
                <span className="block truncate text-center font-mono text-xxs font-normal text-muted-foreground">
                  Topic {reader.pageIndex + 1} / {reader.pages.length} · {selectedMaterial.name}
                </span>
              </Button>
            }
          />
        ) : null}
        {!isTopicWise && current ? (
          <div className="min-w-0 text-center">
            <div className="truncate text-sm font-semibold">{getItemName(current)}</div>
            <div className="font-mono text-xxs text-muted-foreground">
              {index + 1} / {total}
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Tooltip title={previousLabel}>
          <Button
            isSecondary
            isRound
            disabled={isPreviousDisabled}
            aria-label={previousLabel}
            className="h-9 px-3"
            labelClassName="hidden md:block"
            onClick={goBack}
            leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
          >
            Previous
          </Button>
        </Tooltip>
        <Tooltip title={nextLabel}>
          <Button
            isRound
            disabled={isNextDisabled}
            aria-label={nextLabel}
            className="h-9 px-4"
            labelClassName="hidden sm:block"
            onClick={goForward}
            rightsection={<CaretRightIcon weight="bold" className="h-4 w-4" />}
          >
            Next
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};
