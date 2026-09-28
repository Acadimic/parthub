import { Button, Link } from '@repo/ui/app';
import { useRequest } from '@repo/ui/hooks';
import { BlankState } from '@components/others';
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
import { useEffect, useState } from 'react';
import { CourseModules, CourseModulesSkeleton, CoursePreview, CoursePreviewSkeleton } from './components';

interface IProps {
  courseId: string;
  isPreview: boolean;
}

export const Course = ({ courseId, isPreview }: IProps) => {
  const courseStore = useCourseLookups();
  const selectorStore = useSelectorLookups();
  const {
    loadCourseModules,
    loadCourseOutline,
    loadCourses,
    loadCompletedModules,
    loadCoursePlans,
    getCourseById,
    getPlansByCourseId,
  } = courseStore;
  const { getActiveEnrollment, loadMyEnrollments } = useEnrollmentLookups();
  const enrollmentsRequest = useRequest(useEnrollmentStore, 'enrollments');
  const { setSelectedCourseId } = selectorStore;
  const { getSelectedItemIndex, selectResumeItem } = useCourse();
  const selectedCourse = useSelectedCourse();
  const selectedUser = useSelectedUser();
  const coursesRequest = useRequest(useCourseStore, 'courses');
  const modulesRequest = useRequest(useCourseStore, 'courseModules');
  const [isLoading, setIsLoading] = useState(true);

  const loadModulesFor = (course: ICourse | undefined) => {
    if (!course || course.isLoadedContents) return Promise.resolve();
    if (isPreview) return course.isLoadedOutline ? Promise.resolve() : loadCourseOutline(courseId);
    return loadCourseModules(courseId);
  };

  const fetchCourseData = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    // The course list has to land before the modules load: `loadCourseModules` reads the course
    // back out of the store and returns early when it is not there yet.
    if (!getCourseById(courseId)) await loadCourses();
    const course = getCourseById(courseId);
    await Promise.all([
      // The preview renders titles, so it asks for the outline; the learning view needs the bodies.
      loadModulesFor(course),
      selectedUser.isLoadedCompletedModules ? Promise.resolve() : loadCompletedModules(),
      // The plans say whether a seat is needed and the seats say whether the learner holds one.
      loadCoursePlans(courseId),
      enrollmentsRequest.isLoaded ? Promise.resolve() : loadMyEnrollments(),
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
  if (!selectedCourse) {
    return (
      <BlankState
        className="py-24"
        label="Course not found"
        description="It may have been unpublished, or the link is no longer valid."
        action={
          <Link href="/courses" isSecondary>
            Browse courses
          </Link>
        }
      />
    );
  }
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
          <Link href={`/courses/${courseId}/preview`} isSecondary>
            See plans
          </Link>
        }
      />
    );
  }
  return isPreview ? <CoursePreview /> : <CourseModules />;
};
