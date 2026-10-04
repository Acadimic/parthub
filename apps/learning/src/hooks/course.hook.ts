import { ModuleContentType } from '@enums';
import { type ICourseModuleItem, type ICourseProgress } from '@interfaces';
import {
  type ICourseModule,
  type IMaterial,
  type ITestPaper,
  useCourseLookups,
  useMaterialLookups,
  useSelectedUser,
  useSelectorLookups,
  useTestPaperLookups,
} from '@stores';
import { useRouter } from 'next/router';

/** Modules in the order a learner works through them: by day, then as the server listed them. */
const sortByDay = (modules: ICourseModule[]) => [...modules].sort((a, b) => a.day - b.day);

export const useCourse = () => {
  const selectorStore = useSelectorLookups();
  const courseStore = useCourseLookups();
  const materialStore = useMaterialLookups();
  const testPaperStore = useTestPaperLookups();
  const {
    setSelectedCourseModuleId,
    setIsCourseMenuOpen,
    setSelectedMaterialId,
    setSelectedTestPaperId,
    removeSelectedTestPaperId,
    removeSelectedMaterialId,
    removeSelectedContent,
    selectedCourseModuleId,
    selectedMaterialId,
    selectedTestPaperId,
    isCourseMenuOpen,
  } = selectorStore;
  const { getCourseModuleByCourseId, isCourseModuleItemCompleted } = courseStore;
  const { getMaterialVideos, getMaterialsByIds } = materialStore;
  const { getTestPapersByIds } = testPaperStore;
  const selectedUser = useSelectedUser();
  const { push } = useRouter();

  const getCourseModules = (courseId: string) => sortByDay(getCourseModuleByCourseId(courseId));

  /** Every material and test paper of a course, flattened in syllabus order. */
  const getCourseItems = (courseId: string): ICourseModuleItem[] =>
    getCourseModules(courseId).flatMap((courseModule) => [
      ...getMaterialsByIds(courseModule.materials ?? []).map((material) => ({
        courseId,
        courseModuleId: courseModule._id,
        material,
      })),
      ...getTestPapersByIds(courseModule.testPapers ?? []).map((testPaper) => ({
        courseId,
        courseModuleId: courseModule._id,
        testPaper,
      })),
    ]);

  const getItemId = (item: ICourseModuleItem) => item.material?._id ?? item.testPaper?._id ?? '';

  const isItemCompleted = (item: ICourseModuleItem) =>
    isCourseModuleItemCompleted({
      course: item.courseId,
      courseModule: item.courseModuleId,
      collectionItem: getItemId(item),
    });

  const isItemSelected = (item: ICourseModuleItem) =>
    item.courseModuleId === selectedCourseModuleId &&
    ((!!item.material && item.material._id === selectedMaterialId) ||
      (!!item.testPaper && item.testPaper._id === selectedTestPaperId));

  const getCourseProgress = (courseId: string): ICourseProgress => {
    const items = getCourseItems(courseId);
    const completed = items.filter(isItemCompleted).length;
    return { completed, total: items.length, percent: items.length ? (completed / items.length) * 100 : 0 };
  };

  const getSelectedItemIndex = (courseId: string) => getCourseItems(courseId).findIndex(isItemSelected);

  const handleCourseMenuClick = () => {
    setIsCourseMenuOpen(!isCourseMenuOpen);
  };

  const selectItem = (item: ICourseModuleItem) => {
    if (isItemSelected(item)) return;
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

  /** The item to land on when nothing is selected: the first one not yet completed, else the first. */
  const getResumeItem = (courseId: string): ICourseModuleItem | undefined => {
    const items = getCourseItems(courseId);
    return items.find((item) => !isItemCompleted(item)) ?? items[0];
  };

  const selectResumeItem = (courseId: string) => {
    const item = getResumeItem(courseId);
    if (item) selectItem(item);
    return item;
  };

  /** Moves the selection one item along the syllabus; a no-op at either end. */
  const selectAdjacentItem = (courseId: string, direction: 1 | -1) => {
    const items = getCourseItems(courseId);
    const index = getSelectedItemIndex(courseId);
    const next = items[index + direction];
    if (next) selectItem(next);
  };

  /** Sends a visitor with no session to sign in, and back to `redirectUri` afterwards. */
  const pushToSignIn = (redirectUri: string) => push({ pathname: '/sign-in', query: { redirectUri } });

  /** Opens the learning view, by way of signing in when there is no session; the selection survives it. */
  const pushToModules = (courseId: string) => {
    const url = `/courses/${courseId}/modules`;
    if (selectedUser) push(url);
    else pushToSignIn(url);
  };

  /** From the preview page: select the item, then open the learning view. */
  const openItem = (item: ICourseModuleItem) => {
    selectItem(item);
    pushToModules(item.courseId);
  };

  const openCourse = (courseId: string) => {
    selectResumeItem(courseId);
    pushToModules(courseId);
  };

  const getModuleContentType = (material?: IMaterial, testPaper?: ITestPaper) => {
    if (material) return getMaterialVideos(material).length ? ModuleContentType.VIDEO : ModuleContentType.READING;
    if (testPaper) return ModuleContentType.TEST_PAPER;
    return ModuleContentType.COMPLETED;
  };

  return {
    selectedCourseModuleId,
    isCourseMenuOpen,
    handleCourseMenuClick,
    getCourseModules,
    getCourseItems,
    getItemId,
    isItemCompleted,
    isItemSelected,
    getCourseProgress,
    getSelectedItemIndex,
    getResumeItem,
    selectItem,
    selectResumeItem,
    selectAdjacentItem,
    openItem,
    openCourse,
    pushToSignIn,
    getModuleContentType,
  };
};
