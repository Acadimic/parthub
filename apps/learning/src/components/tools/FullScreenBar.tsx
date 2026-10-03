import { Button, Tooltip } from '@repo/ui/app';
import { useCourse } from '@hooks/course.hook';
import { type ICourseModuleItem } from '@interfaces';
import { ArrowsInIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useSelectorLookups } from '@stores';

const getItemName = (item: ICourseModuleItem) => item.material?.name ?? item.testPaper?.name ?? '';

/**
 * The footer of a full-screen viewer: the way back out, where the learner is in the course, and
 * the previous and next lessons, so a course can be read end to end without leaving full screen.
 * A test paper has its own full-screen sitting, so moving to one leaves this one first.
 */
export const FullScreenBar = ({ onExit }: { onExit: () => void }) => {
  const { selectedCourseId } = useSelectorLookups();
  const { getCourseItems, getSelectedItemIndex, selectAdjacentItem } = useCourse();
  const items = selectedCourseId ? getCourseItems(selectedCourseId) : [];
  const index = selectedCourseId ? getSelectedItemIndex(selectedCourseId) : -1;
  const current = items[index];
  const previous = items[index - 1];
  const next = items[index + 1];

  const go = (target: ICourseModuleItem | undefined, direction: 1 | -1) => {
    if (!target || !selectedCourseId) return;
    if (target.testPaper) onExit();
    selectAdjacentItem(selectedCourseId, direction);
  };

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
      <div className="min-w-0 flex-1 text-center">
        {current ? (
          <>
            <div className="truncate text-sm font-semibold">{getItemName(current)}</div>
            <div className="font-mono text-xxs text-muted-foreground">
              {index + 1} / {items.length}
            </div>
          </>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Tooltip title={previous ? `Previous: ${getItemName(previous)}` : 'Start of course'}>
          <Button
            isSecondary
            isRound
            disabled={!previous}
            aria-label={previous ? `Previous: ${getItemName(previous)}` : 'Start of course'}
            className="h-9 px-3"
            labelClassName="hidden md:block"
            onClick={() => go(previous, -1)}
            leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
          >
            Previous
          </Button>
        </Tooltip>
        <Tooltip title={next ? `Next: ${getItemName(next)}` : 'End of course'}>
          <Button
            isRound
            disabled={!next}
            aria-label={next ? `Next: ${getItemName(next)}` : 'End of course'}
            className="h-9 px-4"
            labelClassName="hidden sm:block"
            onClick={() => go(next, 1)}
            rightsection={<CaretRightIcon weight="bold" className="h-4 w-4" />}
          >
            Next
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};
