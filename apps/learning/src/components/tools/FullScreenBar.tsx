import { Button, Tooltip } from '@repo/ui/app';
import { useLessonMoves } from '@hooks/lesson-reader.hook';
import { ArrowsInIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon } from '@phosphor-icons/react';
import { useSelectedMaterial } from '@stores';
import { getItemName, getLessonPageTitle } from '@utils/helpers';
import { TopicPicker } from './TopicPicker';

/**
 * The footer of a full-screen viewer, lesson or test: the way back out, where the learner is, and
 * the previous and next moves, which are the frame's own, so the course reads on without leaving.
 */
export const FullScreenBar = ({ onExit }: { onExit: () => void }) => {
  const selectedMaterial = useSelectedMaterial();
  const { reader, isTopicWise, previousLabel, nextLabel, isPreviousDisabled, isNextDisabled, goBack, goForward } =
    useLessonMoves(selectedMaterial);
  const { currentItem, itemIndex, itemCount } = reader;

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
        {!isTopicWise && currentItem ? (
          <div className="min-w-0 text-center">
            <div className="truncate text-sm font-semibold">{getItemName(currentItem)}</div>
            <div className="font-mono text-xxs text-muted-foreground">
              {itemIndex + 1} / {itemCount}
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
