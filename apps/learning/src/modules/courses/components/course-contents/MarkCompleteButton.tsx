import { SwipeButton } from '@repo/ui/app';
import { CollectionType } from '@enums';
import { CourseService } from '@services';
import { type IMaterial, type ITestPaper, useCourseLookups, useSelectorLookups } from '@stores';
import { successToast } from '@utils/helpers';

interface IProps {
  testPaper?: ITestPaper;
  material?: IMaterial;
}

export const MarkCompleteButton = ({ testPaper, material }: IProps) => {
  const item: ITestPaper | IMaterial | undefined = testPaper || material;
  const courseStore = useCourseLookups();
  const selectorStore = useSelectorLookups();
  const { selectedCourseId, selectedCourseModuleId } = selectorStore;
  const { isCourseModuleItemCompleted } = courseStore;

  if (!item || !selectedCourseId || !selectedCourseModuleId) return null;

  const isCompleted = isCourseModuleItemCompleted({
    course: selectedCourseId,
    courseModule: selectedCourseModuleId,
    collectionItem: item._id,
  });

  const handleComplete = async () => {
    try {
      const completedModule = courseStore.createCompletedModule(
        {
          course: selectedCourseId,
          courseModule: selectedCourseModuleId,
          collectionItem: item._id,
        },
        testPaper ? CollectionType.TEST_PAPER : CollectionType.MATERIAL,
      );
      await CourseService.upsertCompletedModule(completedModule);
      successToast({ message: 'Successfully marked as completed.' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="font-semibold text-base md:text-lg flex items-center justify-between rounded-full">
      <SwipeButton onComplete={handleComplete} isCompleted={isCompleted} />
    </div>
  );
};
