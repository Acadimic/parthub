import { Button, SwipeButton } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { CollectionType } from '@enums';
import { ArrowCounterClockwiseIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { CourseService } from '@services';
import { type IMaterial, type ITestPaper, useCourseLookups, useSelectorLookups } from '@stores';
import { errorToast, successToast } from '@utils/helpers';
import { useState } from 'react';

interface IProps {
  testPaper?: ITestPaper;
  material?: IMaterial;
}

/**
 * Marks the lesson on screen done, or undoes that. A swipe is needed to mark it done so a stray
 * tap cannot; undoing is a plain button, since the worst case is swiping again.
 */
export const MarkCompleteButton = ({ testPaper, material }: IProps) => {
  const item: ITestPaper | IMaterial | undefined = testPaper ?? material;
  const courseStore = useCourseLookups();
  const { selectedCourseId, selectedCourseModuleId } = useSelectorLookups();
  const { isCourseModuleItemCompleted, getCompletedModule, patchCompletedModule, createCompletedModule } = courseStore;
  const [isSaving, setIsSaving] = useState(false);

  if (!item || !selectedCourseId || !selectedCourseModuleId) return null;

  const key = { course: selectedCourseId, courseModule: selectedCourseModuleId, collectionItem: item._id };
  const isCompleted = isCourseModuleItemCompleted(key);

  // One row per item: an existing row is patched rather than a second one created, so undoing and
  // redoing never leaves two rows for the lesson, where the older one would win the lookup.
  const save = async (nextCompleted: boolean) => {
    setIsSaving(true);
    try {
      const existing = getCompletedModule(key);
      if (existing) patchCompletedModule(existing._id, { isCompleted: nextCompleted });
      const row = existing
        ? { ...existing, isCompleted: nextCompleted }
        : createCompletedModule(key, testPaper ? CollectionType.TEST_PAPER : CollectionType.MATERIAL);
      await CourseService.upsertCompletedModule(row);
      successToast({ message: nextCompleted ? 'Marked as completed.' : 'Marked as not completed.' });
    } catch (error) {
      const existing = getCompletedModule(key);
      if (existing) patchCompletedModule(existing._id, { isCompleted: !nextCompleted });
      errorToast({ message: (error as Error)?.message || 'Could not save your progress. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex w-full items-center justify-between gap-3 rounded-full border border-success/30 bg-success/10 py-1.5 pl-4 pr-1.5 sm:w-[240px]">
        <Badge tone="success" appearance="solid" className="gap-1 px-2">
          <CheckCircleIcon weight="fill" className="h-3.5 w-3.5" />
          Completed
        </Badge>
        <Button
          isSubtle
          disabled={isSaving}
          aria-label="Mark as not completed"
          className="rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          leftsection={<ArrowCounterClockwiseIcon weight="bold" className="h-3.5 w-3.5" />}
          onClick={() => save(false)}
        >
          Undo
        </Button>
      </div>
    );
  }

  // Full width on a phone, where a 220px track is too short a swipe to feel deliberate.
  return (
    <div className="w-full sm:w-[240px]">
      <SwipeButton onComplete={() => save(true)} isCompleted={false} disabled={isSaving} isFull height={44} />
    </div>
  );
};
