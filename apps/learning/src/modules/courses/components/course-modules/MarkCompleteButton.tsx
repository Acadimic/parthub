import { Button, SwipeButton, Tooltip } from '@repo/ui/app';
import { CollectionType } from '@enums';
import { useLessonReader } from '@hooks/lesson-reader.hook';
import { ArrowCounterClockwiseIcon, CheckIcon } from '@phosphor-icons/react';
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
 * tap cannot; undoing is a plain button, since the worst case is swiping again. In the topic
 * reader the swipe waits until every page of the lesson has been opened.
 */
export const MarkCompleteButton = ({ testPaper, material }: IProps) => {
  const item: ITestPaper | IMaterial | undefined = testPaper ?? material;
  const courseStore = useCourseLookups();
  const { selectedCourseId, selectedCourseModuleId } = useSelectorLookups();
  const { isCourseModuleItemCompleted, getCompletedModule, patchCompletedModule, createCompletedModule } = courseStore;
  const { isReader, pages } = useLessonReader(material);
  const [isSaving, setIsSaving] = useState(false);

  if (!item || !selectedCourseId || !selectedCourseModuleId) return null;

  const key = { course: selectedCourseId, courseModule: selectedCourseModuleId, collectionItem: item._id };
  const isCompleted = isCourseModuleItemCompleted(key);
  const unviewedCount =
    material && isReader
      ? courseStore.countUnviewedLessonPages(
          material._id,
          pages.map((page) => page.key),
        )
      : 0;

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
      <div className="flex h-9 w-full items-center justify-between gap-2 rounded-full border border-success/30 bg-success/10 pl-1 pr-1 sm:w-[200px]">
        <span className="flex items-center gap-2 text-sm font-semibold text-success">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-success-foreground">
            <CheckIcon weight="bold" className="h-4 w-4" />
          </span>
          Completed
        </span>
        <Button
          isSubtle
          disabled={isSaving}
          aria-label="Mark as not completed"
          className="h-7 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
          leftsection={<ArrowCounterClockwiseIcon weight="bold" className="h-3.5 w-3.5" />}
          onClick={() => save(false)}
        >
          Undo
        </Button>
      </div>
    );
  }

  if (unviewedCount) {
    const hint = `Open ${unviewedCount === pages.length ? 'all' : 'the remaining'} ${unviewedCount} ${unviewedCount === 1 ? 'topic' : 'topics'} to complete this lesson`;
    return (
      <Tooltip title={hint}>
        <div className="w-full sm:w-[200px]">
          <SwipeButton
            onComplete={() => save(true)}
            isCompleted={false}
            disabled
            isFull
            height={36}
            text={`${pages.length - unviewedCount} of ${pages.length} topics read`}
          />
        </div>
      </Tooltip>
    );
  }

  // Full width on a phone, where a 220px track is too short a swipe to feel deliberate.
  return (
    <div className="w-full sm:w-[200px]">
      <SwipeButton onComplete={() => save(true)} isCompleted={false} disabled={isSaving} isFull height={36} />
    </div>
  );
};
