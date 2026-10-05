import { Button } from '@repo/ui/app';
import { CollectionType } from '@enums';
import { useBookmark } from '@hooks/bookmark.hook';
import { useCourse } from '@hooks/course.hook';
import { BookmarkSimpleIcon, PrinterIcon, ShareFatIcon } from '@phosphor-icons/react';
import {
  type ICourse,
  useCourseLookups,
  useEnrollmentLookups,
  useResourceLookups,
  useResourceStore,
  useSelectedUser,
} from '@stores';
import { errorToast, getCoursePath, successToast } from '@utils/helpers';
import { useEffect } from 'react';
import { shareCourse } from '../course-modules';

interface IProps {
  course: ICourse;
}

const ACTION_CLASS = 'px-3 py-1.5 text-sm';

/**
 * Save, share and print, beside the teacher. Saving needs an account, so a visitor is sent to sign
 * in; printing needs a seat, so without one it explains that rather than opening an empty printout.
 */
export const CourseActions = ({ course }: IProps) => {
  const selectedUser = useSelectedUser();
  const { isBookmarked } = useResourceLookups();
  const { toggleBookmark, isLoadingBookmark } = useBookmark();
  const { isEnrolled } = useEnrollmentLookups();
  const { pushToSignIn } = useCourse();
  const { getPlansByCourseId } = useCourseLookups();
  const isPaid = getPlansByCourseId(course._id).some((plan) => plan.amount > 0);
  const isSaved = isBookmarked(course._id);

  // Not `useLoadOnce`: a visitor has no bookmarks to load, and the request would only fail.
  useEffect(() => {
    const store = useResourceStore.getState();
    if (selectedUser && store.shouldLoad('bookmarks')) store.loadBookmarks();
  }, [selectedUser?._id]);

  const handleSave = async () => {
    if (!selectedUser) {
      pushToSignIn(getCoursePath(course));
      return;
    }
    try {
      await toggleBookmark(course._id, CollectionType.COURSE);
      if (!isSaved) successToast({ message: 'Saved. Find it under Activity, in Saved.' });
    } catch {
      errorToast({ message: 'Could not update your saved courses. Please try again.' });
    }
  };

  const handlePrint = () => {
    if (!isEnrolled(course._id)) {
      errorToast({
        message: 'Enrol in this course to print it',
        description: isPaid
          ? 'The printout holds every lesson and quiz, so it opens with the course. Choose a plan and enrol, then print.'
          : 'The printout holds every lesson and quiz, so it opens with the course. Enrolling is free and takes one click.',
      });
      return;
    }
    window.open(`/courses/${course._id}/print`, '_blank');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        isSecondary
        aria-pressed={isSaved}
        className={ACTION_CLASS}
        isLoading={isLoadingBookmark}
        hideLoadingIcon
        onClick={handleSave}
        leftsection={
          <BookmarkSimpleIcon
            weight={isSaved ? 'fill' : 'bold'}
            className={isSaved ? 'h-4 w-4 text-warning' : 'h-4 w-4'}
          />
        }
      >
        {isSaved ? 'Saved' : 'Save'}
      </Button>
      <Button
        isSecondary
        className={ACTION_CLASS}
        onClick={() => shareCourse(course._id)}
        leftsection={<ShareFatIcon weight="bold" className="h-4 w-4" />}
      >
        Share
      </Button>
      <Button
        isSecondary
        className={ACTION_CLASS}
        onClick={handlePrint}
        leftsection={<PrinterIcon weight="bold" className="h-4 w-4" />}
      >
        Print
      </Button>
    </div>
  );
};
