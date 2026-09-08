import { ModuleContentType } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { BookOpenTextIcon, CheckIcon, ClipboardTextIcon, VideoIcon } from '@phosphor-icons/react';
import { IMaterial, ITestPaper, useStores } from '@stores';
import { observer } from 'mobx-react-lite';
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
    <CheckIcon weight="bold" className="w-5 h-5 p-1 bg-green-primary text-white rounded-full" />
  ),
};

export const CourseContentItem = observer(
  ({ isPreview, material, testPaper, courseId, courseModuleId, closeCourseOverview }: IProps) => {
    const { courseStore, selectorStore } = useStores();
    const { isCourseModuleItemCompleted } = courseStore;
    const { onClickCourseContentItem, onClickCoursePreviewContentItem, getModuleContentType } = useCourse();
    const { selectedMaterialId, selectedTestPaperId, selectedCourseModuleId } = selectorStore;

    const moduleContentType = useMemo(() => {
      return getModuleContentType(material, testPaper);
    }, [courseId]);

    const handleClick = () => {
      if (isPreview) onClickCoursePreviewContentItem({ courseId, material, testPaper, courseModuleId });
      else onClickCourseContentItem({ courseId, material, testPaper, courseModuleId });
      closeCourseOverview();
    };

    const isCompleted = isCourseModuleItemCompleted({
      course: courseId,
      courseModule: courseModuleId,
      collectionItem: material?._id || testPaper?._id || '',
    });

    return (
      <div
        className={`flex items-start space-x-3 px-4 hover:bg-color-light py-3 cursor-pointer ${
          !isPreview &&
          selectedCourseModuleId === courseModuleId &&
          ((material && selectedMaterialId === material._id) || (testPaper && selectedTestPaperId === testPaper._id))
            ? 'bg-color-light'
            : ''
        }`}
        onClick={handleClick}
      >
        <div className="w-8 h-8 rounded-full bg-color-light flex items-center justify-center">
          {ICON_MAPS[isCompleted ? ModuleContentType.COMPLETED : moduleContentType]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{material?.name || testPaper?.name}</p>
          <div className="text-xs text-color-secondary flex items-center space-x-1">
            <span className="capitalize">{moduleContentType}</span>
            <span className="mx-1 text-xs">•</span>
            <span>{material?.durationMins || testPaper?.durationMins} mins</span>
          </div>
        </div>
      </div>
    );
  },
);
