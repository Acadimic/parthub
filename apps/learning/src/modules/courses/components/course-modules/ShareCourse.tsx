import { useCourseStore } from '@stores';
import { getAbsoluteUrl, successToast } from '@utils/helpers';

/** Shares the course's public address, `/courses/<slug>`, which anyone can open signed in or not. */
export const shareCourse = async (courseId: string) => {
  const url = getAbsoluteUrl(useCourseStore.getState().getCoursePathById(courseId));
  const canShare = typeof navigator.share === 'function';
  if (canShare) {
    try {
      await navigator.share({ url });
      return;
    } catch {
      // The learner dismissed the share sheet, or it is not allowed here; fall back to copying.
    }
  }
  await navigator.clipboard.writeText(url);
  successToast({ message: 'Course link copied to clipboard.' });
};
