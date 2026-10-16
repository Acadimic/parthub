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
    else if (selectedCourseId) selectAdjacentItem(selectedCourseId, 1, 0);
  };

  const goPrevious = () => {
    if (pageIndex > 0) goToPage(pageIndex - 1);
    else if (selectedCourseId) selectAdjacentItem(selectedCourseId, -1, 'last');
  };

  return {
    isReader: lessonViewMode === LessonViewMode.READER,
    pages,
    page,
    pageIndex,
    isFirstPage,
    isLastPage,
    /** Where the lesson sits in the course's flat sequence of lessons and tests. */
    itemIndex,
    itemCount: items.length,
    currentItem: items[itemIndex],
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

/**
 * One Previous and one Next over the lesson, whichever view is on. In the topic reader a move is
 * one topic, handing over to the neighbouring lesson past either end; in the full view it is one
 * lesson. `forwardTarget` names the item Next lands on when it leaves the lesson, and `nextPage`
 * the topic it lands on when it stays, so a pager can say where it is going.
 */
export const useLessonMoves = (material: IMaterial | undefined) => {
  const { selectedCourseId } = useSelectorLookups();
  const { selectAdjacentItem } = useCourse();
  const reader = useLessonReader(material);
  const { previousItem, nextItem, isLastPage, pages, pageIndex } = reader;
  const isTopicWise = reader.isReader && !!reader.page;
  const forwardTarget = !isTopicWise || isLastPage ? nextItem : undefined;
  const nextPage: ILessonPage | undefined = isTopicWise && !isLastPage ? pages[pageIndex + 1] : undefined;

  const goToItem = (direction: 1 | -1) => {
    if (selectedCourseId) selectAdjacentItem(selectedCourseId, direction, 0);
  };

  return {
    reader,
    isTopicWise,
    forwardTarget,
    nextPage,
    previousLabel: isTopicWise ? reader.previousLabel : getEdgeLabel(previousItem, 'Previous', 'Start of course'),
    nextLabel: isTopicWise ? reader.nextLabel : getEdgeLabel(nextItem, 'Next', 'End of course'),
    isPreviousDisabled: isTopicWise ? reader.isPreviousDisabled : !previousItem,
    isNextDisabled: isTopicWise ? reader.isNextDisabled : !nextItem,
    goBack: () => (isTopicWise ? reader.goPrevious() : goToItem(-1)),
    goForward: () => (isTopicWise ? reader.goNext() : goToItem(1)),
  };
};
