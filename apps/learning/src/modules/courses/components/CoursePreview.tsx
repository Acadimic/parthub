import { Container } from '@components/others';
import { useCourse } from '@hooks/course.hook';
import { useCourseLookups, useEnrollmentLookups, useSelectedCourse } from '@stores';
import { CourseHero, CourseHighlights, CourseSummaryCard } from './course-preview';
import { CourseOutline } from './CourseOutline';

export const CoursePreview = () => {
  const selectedCourse = useSelectedCourse();
  const { openItem } = useCourse();
  const { getPlansByCourseId } = useCourseLookups();
  const { isEnrolled } = useEnrollmentLookups();

  if (!selectedCourse) return null;

  // Rows lock on a priced course the learner has not bought; the buy box beside them opens it.
  const isLocked =
    getPlansByCourseId(selectedCourse._id).some((plan) => plan.amount > 0) && !isEnrolled(selectedCourse._id);

  return (
    <div className="relative pb-16">
      {/* A tinted band behind the title. It fades out rather than ending at a line, so the title
          block may run past it on a phone without a visible seam. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 to-background"
      />
      <Container>
        <div className="relative grid gap-8 py-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-10">
            <CourseHero course={selectedCourse} />
            <div className="lg:hidden">
              <CourseSummaryCard course={selectedCourse} />
            </div>
            <CourseHighlights course={selectedCourse} />
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Syllabus</h2>
              <div className="rounded-xl border border-border bg-background">
                <CourseOutline courseId={selectedCourse._id} isPreview isLocked={isLocked} onSelectItem={openItem} />
              </div>
            </section>
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <CourseSummaryCard course={selectedCourse} />
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
};
