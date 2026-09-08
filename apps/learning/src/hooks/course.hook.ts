import { CourseItemType, ModuleContentType } from '@enums';
import { type ICourseContentItem } from '@interfaces';
import { type IMaterial, type ITestPaper, useStores } from '@stores';
import { useRouter } from 'next/router';
import { useApp } from './app.hook';
import { useWindowDimensions } from './dimensions.hook';

export const useCourse = () => {
  const { courseStore, selectorStore, materialStore } = useStores();
  const {
    setSelectedCourseItem,
    setSelectedCourseModuleId,
    removeSelectedCourseModuleId,
    setIsCourseMenuOpen,
    setSelectedMaterialId,
    setSelectedTestPaperId,
    removeSelectedTestPaperId,
    removeSelectedMaterialId,
    removeSelectedContent,
    selectedCourseItem,
    selectedCourseModuleId,
    isCourseMenuOpen,
  } = selectorStore;
  const { getMaterialVideos } = materialStore;
  const { scrollToDiv } = useApp();
  const { push } = useRouter();

  const { isSmallScreen } = useWindowDimensions();
  // const collapsed = localStorage.getItem(StorageKey.COLLAPSED);
  // const isOpen = collapsed ? collapsed === 'true' : !isSmallScreen;
  // const [isCourseMenuOpen, setIsCourseMenuOpen] = useState<boolean>(isOpen);

  const onSelectCourseItem = (courseItem: CourseItemType) => {
    if (isSmallScreen) handleCourseMenuClick();
    setSelectedCourseItem(courseItem);
    removeSelectedCourseModuleId();
  };

  const onSelectCourseModule = (courseModuleId: string) => {
    if (isSmallScreen) handleCourseMenuClick();
    setSelectedCourseItem(CourseItemType.COURSE_MATERIALS);
    setSelectedCourseModuleId(courseModuleId);
    scrollToDiv(courseModuleId);
  };

  const handleCourseMenuClick = () => {
    // localStorage.setItem(StorageKey.COLLAPSED, isCourseMenuOpen ? 'false' : 'true');
    setIsCourseMenuOpen(!isCourseMenuOpen);
  };

  const onClickCourseContentItem = (item: ICourseContentItem) => {
    const { material, testPaper, courseModuleId } = item;
    setSelectedCourseModuleId(courseModuleId);
    if (material) {
      setSelectedMaterialId(material._id);
      removeSelectedTestPaperId();
    } else if (testPaper) {
      setSelectedTestPaperId(testPaper._id);
      removeSelectedMaterialId();
    }
    removeSelectedContent();
  };

  const onClickCoursePreviewContentItem = (item: ICourseContentItem) => {
    const { courseId } = item;
    onClickCourseContentItem(item);
    push(`/courses/${courseId}/modules`);
  };

  const getModuleContentType = (material?: IMaterial, testPaper?: ITestPaper) => {
    if (material) {
      const videos = getMaterialVideos(material);
      // console.log('@@@@videos: ', videos.length, material.name);
      if (videos.length) return ModuleContentType.VIDEO;
      return ModuleContentType.READING;
    }
    if (testPaper) return ModuleContentType.TEST_PAPER;
    return ModuleContentType.COMPLETED;
  };

  return {
    onSelectCourseItem,
    onSelectCourseModule,
    selectedCourseItem,
    selectedCourseModuleId,
    handleCourseMenuClick,
    isCourseMenuOpen,
    onClickCourseContentItem,
    onClickCoursePreviewContentItem,
    getModuleContentType,
  };
};
