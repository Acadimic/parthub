import { useSelectorStore } from '@stores';

/** Set while the course book holds the browser's full screen, so closing it gives back only that. */
let isBookFullScreen = false;

/**
 * Opens the whole course as pages, in the browser's full screen too. Call it from a tap: that is the
 * only moment a browser grants full screen. A screen already full (a lesson's) is left as it is.
 */
export const openCourseBook = () => {
  useSelectorStore.getState().setIsCourseBookOpen(true);
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  isBookFullScreen = true;
  document.documentElement.requestFullscreen().catch(() => (isBookFullScreen = false));
};

/** Closes the course book, and leaves the browser's full screen if the book is what entered it. */
export const closeCourseBook = () => {
  useSelectorStore.getState().setIsCourseBookOpen(false);
  if (isBookFullScreen && document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  isBookFullScreen = false;
};
