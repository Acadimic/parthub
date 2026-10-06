import { Button, Link } from '@repo/ui/app';
import { useRequest } from '@repo/ui/hooks';
import { BlankState } from '@components/others';
import { Subdomain } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import {
  type ICourse,
  useCourseLookups,
  useCourseStore,
  useEnrollmentLookups,
  useEnrollmentStore,
  useSelectedCourse,
  useSelectedUser,
  useSelectorLookups,
} from '@stores';
import { getCoursePath, getToken } from '@utils/helpers';
import { useEffect, useState } from 'react';
import { CourseModules, CourseModulesSkeleton, CoursePreview, CoursePreviewSkeleton } from './components';

/** A course that is not there: unpublished, renamed, or a link that never pointed at one. */
export const CourseNotFound = () => (
  <BlankState
    className="py-24"
    label="Course not found"
    description="It may have been renamed or unpublished, or the link is no longer valid."
    action={
      <Link href="/courses" isSecondary>
        Browse courses
      </Link>
    }
  />
);

interface IProps {
  courseId: string;
  isPreview: boolean;
}

export const Course = ({ courseId, isPreview }: IProps) => {
  const courseStore = useCourseLookups();
  const selectorStore = useSelectorLookups();
  const { loadCourseOutline, loadCompletedModules, loadCoursePlans, getCourseById, getPlansByCourseId } = courseStore;
  const { getActiveEnrollment, loadMyEnrollments } = useEnrollmentLookups();
  const enrollmentsRequest = useRequest(useEnrollmentStore, 'enrollments');
  const { setSelectedCourseId, selectedCourseModuleId } = selectorStore;
  const { getSelectedItemIndex, selectResumeItem } = useCourse();
  const selectedCourse = useSelectedCourse();
  const selectedUser = useSelectedUser();
  const coursesRequest = useRequest(useCourseStore, 'courses');
  const modulesRequest = useRequest(useCourseStore, 'courseModules');
  const [isLoading, setIsLoading] = useState(true);

  // Both views open on the outline — titles, kinds and durations — and the learning view then
  // fetches a module's lesson bodies when it is opened (below). A course's bodies run to megabytes, and
  // waiting for all of them held the page on a skeleton for seconds.
  const loadModulesFor = (course: ICourse | undefined) =>
    course?.isLoadedContents || course?.isLoadedOutline ? Promise.resolve() : loadCourseOutline(courseId);

  const fetchCourseData = async () => {
    // The preview is public, so it loads without a session; the learning view waits for the user.
    const isSignedIn = !!getToken(Subdomain.LEARN);
    if (isSignedIn ? !selectedUser : !isPreview) return;
    setIsLoading(true);
    // All at once: the outline asks for the catalogue itself when the course is not in it yet.
    await Promise.all([
      loadModulesFor(getCourseById(courseId)),
      !selectedUser || selectedUser.isLoadedCompletedModules ? Promise.resolve() : loadCompletedModules(),
      // The plans say whether a seat is needed and the seats say whether the learner holds one.
      loadCoursePlans(courseId),
      !selectedUser || enrollmentsRequest.isLoaded ? Promise.resolve() : loadMyEnrollments(),
    ]);
    setSelectedCourseId(courseId);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!courseId) return;
    fetchCourseData();
  }, [courseId, selectedUser?._id]);

  // The learning view needs an item on screen. After a fresh load — a hard refresh, a shared link —
  // nothing is selected, so it opens on the first lesson the learner has not finished.
  useEffect(() => {
    if (isLoading || isPreview || !selectedCourse) return;
    if (getSelectedItemIndex(courseId) === -1) selectResumeItem(courseId);
  }, [isLoading, isPreview, selectedCourse?._id]);

  // The lesson bodies of the module on screen, fetched when the learner opens it. A module already
  // loaded is skipped by the store.
  useEffect(() => {
    if (isLoading || isPreview || !selectedCourseModuleId) return;
    useCourseStore.getState().loadModuleContents(courseId, selectedCourseModuleId);
  }, [isLoading, isPreview, courseId, selectedCourseModuleId]);

  if (isLoading) return isPreview ? <CoursePreviewSkeleton /> : <CourseModulesSkeleton />;

  // The store swallows a failed request into its status, so the page has to look for it: a course
  // that never arrived, or one whose modules did not.
  const failure = coursesRequest.isFailed ? coursesRequest : modulesRequest;
  if (failure.isFailed) {
    return (
      <BlankState
        className="py-24"
        label="Could not load this course"
        description={failure.error || 'Something went wrong on our side. Please try again.'}
        action={
          <Button
            isSecondary
            onClick={fetchCourseData}
            leftsection={<ArrowClockwiseIcon weight="bold" className="h-4 w-4" />}
          >
            Try again
          </Button>
        }
      />
    );
  }
  if (!selectedCourse) return <CourseNotFound />;
  // A priced course opens only on a seat. The server strips lesson bodies and refuses tests and
  // progress without one, so this is the honest screen rather than a hollow lesson.
  const isPaidCourse = getPlansByCourseId(courseId).some((plan) => plan.amount > 0);
  if (!isPreview && isPaidCourse && !getActiveEnrollment(courseId)) {
    return (
      <BlankState
        className="py-24"
        label="Enrol to open this course"
        description={`${selectedCourse.name} is a paid course. Choose a plan on its page to unlock the lessons and tests.`}
        action={
          <Link href={getCoursePath(selectedCourse)} isSecondary>
            See plans
          </Link>
        }
      />
    );
  }
  return isPreview ? <CoursePreview /> : <CourseModules />;
};
