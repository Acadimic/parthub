import { Button, SwipeButton, Tooltip } from '@repo/ui/app';
import { CollectionType } from '@enums';
import { ArrowCounterClockwiseIcon, CheckIcon } from '@phosphor-icons/react';
import { type IMaterial, type ITestPaper, useCourseLookups, useSelectorLookups } from '@stores';
import { errorToast, successToast } from '@utils/helpers';
import { useState } from 'react';

interface IProps {
  testPaper?: ITestPaper;
  material?: IMaterial;
}

/**
 * Marks the lesson on screen done, or undoes that, at any time. A swipe is needed to mark it done
 * so a stray tap cannot; undoing is a plain button, since the worst case is swiping again.
 */
export const MarkCompleteButton = ({ testPaper, material }: IProps) => {
  const item: ITestPaper | IMaterial | undefined = testPaper ?? material;
  const { isCourseModuleItemCompleted, saveCompletedModule } = useCourseLookups();
  const { selectedCourseId, selectedCourseModuleId } = useSelectorLookups();
  const [isSaving, setIsSaving] = useState(false);

  if (!item || !selectedCourseId || !selectedCourseModuleId) return null;

  const key = { course: selectedCourseId, courseModule: selectedCourseModuleId, collectionItem: item._id };
  const isCompleted = isCourseModuleItemCompleted(key);

  const save = async (nextCompleted: boolean) => {
    setIsSaving(true);
    try {
      await saveCompletedModule(key, testPaper ? CollectionType.TEST_PAPER : CollectionType.MATERIAL, nextCompleted);
      successToast({ message: nextCompleted ? 'Marked as completed.' : 'Marked as not completed.' });
    } catch (error) {
      errorToast({ message: (error as Error)?.message || 'Could not save your progress. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isCompleted) {
    return (
      // The same room as the swipe it replaces, so the line does not shift when a lesson is done.
      <div className="flex h-9 min-w-0 flex-1 items-center justify-between gap-1 rounded-full border border-success/30 bg-success/10 pl-1 pr-1 sm:w-[212px] sm:flex-none">
        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-success sm:text-sm">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <CheckIcon weight="bold" className="h-4 w-4" />
          </span>
          <span className="truncate">Completed</span>
        </span>
        <Tooltip title="Mark as not completed">
          <Button
            isSubtle
            disabled={isSaving}
            aria-label="Mark as not completed"
            className="h-7 shrink-0 rounded-full px-2 text-xs text-muted-foreground hover:text-foreground"
            labelClassName="hidden sm:block"
            leftsection={<ArrowCounterClockwiseIcon weight="bold" className="h-3.5 w-3.5" />}
            onClick={() => save(false)}
          >
            Undo
          </Button>
        </Tooltip>
      </div>
    );
  }

  // The room left on a phone's line, where a 220px track is too short a swipe to feel deliberate.
  return (
    <div className="min-w-0 flex-1 sm:w-[212px] sm:flex-none">
      <SwipeButton onComplete={() => save(true)} isCompleted={false} disabled={isSaving} isFull height={36} />
    </div>
  );
};
