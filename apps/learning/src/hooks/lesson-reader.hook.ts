import { LessonViewMode } from '@enums';
import { type ILessonPage } from '@interfaces';
import { type IMaterial, useSelectorLookups } from '@stores';
import { getEdgeLabel, getLessonPages } from '@utils/helpers';
import { useMemo } from 'react';
import { useCourse } from './course.hook';

/**
 * Where the reader is in a lesson: its pages, the one on screen, and the moves. Prev on the first
 * page and Next on the last hand over to the item pager, so the whole course reads as one sequence.
 */
export const useLessonReader = (material: IMaterial | undefined) => {
  const { selectedCourseId, selectedLessonPageIndex, setSelectedLessonPageIndex, lessonViewMode } =
    useSelectorLookups();
  const { getCourseItems, getSelectedItemIndex, selectAdjacentItem } = useCourse();
  // Rows are immutable, so the identity check is what says the lesson changed.
  const pages: ILessonPage[] = useMemo(() => (material ? getLessonPages(material) : []), [material]);

  const lastIndex = Math.max(pages.length - 1, 0);
  const pageIndex = selectedLessonPageIndex === 'last' ? lastIndex : Math.min(selectedLessonPageIndex, lastIndex);
  const page: ILessonPage | undefined = pages[pageIndex];
  const items = selectedCourseId ? getCourseItems(selectedCourseId) : [];
  const itemIndex = selectedCourseId ? getSelectedItemIndex(selectedCourseId) : -1;

  const goToPage = (index: number) => setSelectedLessonPageIndex(index);

  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === lastIndex;
  const previousItem = items[itemIndex - 1];
  const nextItem = items[itemIndex + 1];

  const goNext = () => {
    if (pageIndex < lastIndex) goToPage(pageIndex + 1);
    else if (selectedCourseId) selectAdjacentItem(selectedCourseId, 1);
  };

  const goPrevious = () => {
    if (pageIndex > 0) goToPage(pageIndex - 1);
    else if (selectedCourseId) selectAdjacentItem(selectedCourseId, -1);
  };

  return {
    isReader: lessonViewMode === LessonViewMode.READER,
    pages,
    page,
    pageIndex,
    isFirstPage,
    isLastPage,
    /** The item the pager moves to past either end of the lesson, if there is one. */
    previousItem,
    nextItem,
    /** What each move reads and whether it is possible, shared by every pager over the reader. */
    previousLabel: isFirstPage ? getEdgeLabel(previousItem, 'Previous', 'Start of course') : 'Previous topic',
    nextLabel: isLastPage ? getEdgeLabel(nextItem, 'Next', 'End of course') : 'Next topic',
    isPreviousDisabled: isFirstPage && !previousItem,
    isNextDisabled: isLastPage && !nextItem,
    goToPage,
    goNext,
    goPrevious,
  };
};
