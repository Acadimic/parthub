import { useCourse } from '@hooks/course.hook';
import { type ICourseModuleItem } from '@interfaces';
import { useSelectorLookups } from '@stores';

/** The lesson or test in the learning view's frame, as a thread or a doubt refers to it. */
export interface IOpenItem {
  name: string;
  isTest: boolean;
  courseModule: string;
  material: string | null;
  testPaper: string | null;
}

export const useOpenItem = (courseId: string): IOpenItem | null => {
  const { selectedCourseModuleId, selectedMaterialId, selectedTestPaperId } = useSelectorLookups();
  const { getCourseItems } = useCourse();
  // One of the two ids is set while an item is in the frame; the other is what the selector left behind.
  const isOpen = ({ material, testPaper }: ICourseModuleItem) =>
    selectedMaterialId ? material?._id === selectedMaterialId : testPaper?._id === selectedTestPaperId;
  const item = getCourseItems(courseId).find(isOpen);
  const content = item?.material ?? item?.testPaper;
  if (!item || !content) return null;
  return {
    name: content.name,
    isTest: Boolean(item.testPaper),
    courseModule: selectedCourseModuleId,
    material: item.material?._id ?? null,
    testPaper: item.testPaper?._id ?? null,
  };
};
