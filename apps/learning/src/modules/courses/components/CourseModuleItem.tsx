import { ModuleContentType } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { BookOpenTextIcon, CheckIcon, ClipboardTextIcon, VideoIcon } from '@phosphor-icons/react';
import { type IMaterial, type ITestPaper, useCourseLookups, useSelectorLookups } from '@stores';
import { useMemo } from 'react';

interface IProps {
  courseId: string;
  courseModuleId: string;
  isPreview: boolean;
  material?: IMaterial;
  testPaper?: ITestPaper;
  closeCourseOverview: () => void;
}

const ICON_MAPS = {
  [ModuleContentType.VIDEO]: <VideoIcon className="w-5 h-5" />,
  [ModuleContentType.READING]: <BookOpenTextIcon className="w-5 h-5" />,
  [ModuleContentType.TEST_PAPER]: <ClipboardTextIcon className="w-5 h-5" />,
  [ModuleContentType.COMPLETED]: (
    <CheckIcon weight="bold" className="w-5 h-5 p-1 bg-success text-success-foreground rounded-full" />
  ),
};

/**
 * A module item is either a material or a test paper, never both, and the row shows the same three
 * fields either way. Resolving them once here keeps the `material?.x ?? testPaper?.x` fallback out
 * of the markup, where it was repeated for every field.
 */
const getItemDetails = (material?: IMaterial, testPaper?: ITestPaper) => ({
  id: material?._id ?? testPaper?._id ?? '',
  name: material?.name ?? testPaper?.name ?? '',
  durationMins: material?.durationMins ?? testPaper?.durationMins ?? 0,
});

export const CourseModuleItem = ({
  isPreview,
  material,
  testPaper,
  courseId,
  courseModuleId,
  closeCourseOverview,
}: IProps) => {
  const courseStore = useCourseLookups();
  const selectorStore = useSelectorLookups();
  const { isCourseModuleItemCompleted } = courseStore;
  const { onClickCourseModuleItem, onClickCoursePreviewModuleItem, getModuleContentType } = useCourse();
  const { selectedMaterialId, selectedTestPaperId, selectedCourseModuleId } = selectorStore;

  const moduleContentType = useMemo(() => {
    return getModuleContentType(material, testPaper);
  }, [courseId]);

  const handleClick = () => {
    if (isPreview) onClickCoursePreviewModuleItem({ courseId, material, testPaper, courseModuleId });
    else onClickCourseModuleItem({ courseId, material, testPaper, courseModuleId });
    closeCourseOverview();
  };

  const item = getItemDetails(material, testPaper);
  const isCompleted = isCourseModuleItemCompleted({
    course: courseId,
    courseModule: courseModuleId,
    collectionItem: item.id,
  });

  return (
    <div
      className={`flex items-start space-x-3 px-4 hover:bg-accent py-3 cursor-pointer ${
        !isPreview &&
        selectedCourseModuleId === courseModuleId &&
        (selectedMaterialId === material?._id || selectedTestPaperId === testPaper?._id)
          ? 'bg-accent'
          : ''
      }`}
      onClick={handleClick}
    >
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
        {ICON_MAPS[isCompleted ? ModuleContentType.COMPLETED : moduleContentType]}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{item.name}</p>
        <div className="text-xs text-muted-foreground flex items-center space-x-1">
          <span className="capitalize">{moduleContentType}</span>
          <span className="mx-1 text-xs">•</span>
          <span>{item.durationMins} mins</span>
        </div>
      </div>
    </div>
  );
};
