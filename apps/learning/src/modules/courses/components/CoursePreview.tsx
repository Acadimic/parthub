import { Container } from '@components/others';
import { useCourse } from '@hooks/course.hook';
import { cn } from '@repo/ui/lib';
import { useCourseLookups, useEnrollmentLookups, useSelectedCourse, useSelectedUser } from '@stores';
import { useEffect, useRef, useState } from 'react';
import {
  CourseCta,
  CourseHero,
  CourseHighlights,
  CourseSummaryCard,
  EnrolButton,
  getDefaultPlanId,
} from './course-preview';
import { CourseOutline } from './CourseOutline';
import { CourseReviewsSection } from './course-discussion';

/** The fixed header's height on a phone, which hides whatever scrolls up beneath it. */
const HEADER_HEIGHT = 56;

export const CoursePreview = () => {
  const selectedCourse = useSelectedCourse();
  const isSignedIn = Boolean(useSelectedUser());
  // `PageLayout` shows a signed-in learner the phone tab bar below `md`; the action bar floats above it.
  const hasTabBar = isSignedIn;
  const { openItem } = useCourse();
  const { getPlansByCourseId } = useCourseLookups();
  const { isEnrolled, getActiveEnrollment } = useEnrollmentLookups();
  const plans = selectedCourse ? getPlansByCourseId(selectedCourse._id) : [];
  const [selectedPlanId, setSelectedPlanId] = useState(() => getDefaultPlanId(plans));
  const hasEnrollment = selectedCourse ? Boolean(getActiveEnrollment(selectedCourse._id)) : false;
  const mobileCardRef = useRef<HTMLDivElement>(null);
  const [isCtaScrolledPast, setIsCtaScrolledPast] = useState(false);

  // The phone's action bar appears only once the card's own button has scrolled up under the header.
  useEffect(() => {
    const cta = mobileCardRef.current?.querySelector('[data-course-cta]');
    if (!cta) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsCtaScrolledPast(!entry.isIntersecting && entry.boundingClientRect.top < HEADER_HEIGHT),
      { rootMargin: `-${HEADER_HEIGHT}px 0px 0px 0px` },
    );
    observer.observe(cta);
    return () => observer.disconnect();
  }, [selectedCourse?._id, hasEnrollment]);

  if (!selectedCourse) return null;

  // Rows lock on a priced course the learner has not bought; the buy box beside them opens it.
  const isLocked = plans.some((plan) => plan.amount > 0) && !isEnrolled(selectedCourse._id);
  const selectedPlan = plans.find((plan) => plan._id === selectedPlanId) ?? null;

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
            <div ref={mobileCardRef} className="lg:hidden">
              <CourseSummaryCard
                course={selectedCourse}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
              />
            </div>
            <CourseHighlights course={selectedCourse} />
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Syllabus</h2>
              <div className="rounded-xl border border-border bg-background">
                <CourseOutline courseId={selectedCourse._id} isPreview isLocked={isLocked} onSelectItem={openItem} />
              </div>
            </section>
            <CourseReviewsSection courseId={selectedCourse._id} canReview={isSignedIn && !isLocked} />
          </div>
          <aside className="hidden lg:block">
            {/* Capped at the viewport so a card with several plans can still be scrolled to its end. */}
            <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto">
              <CourseSummaryCard
                course={selectedCourse}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
              />
            </div>
          </aside>
        </div>
      </Container>
      {/* Sticky rather than fixed, so it comes to rest above the footer instead of covering it. */}
      <div
        inert={!isCtaScrolledPast}
        className={cn(
          'sticky z-40 mx-4 rounded-xl border border-border/70 bg-background p-3 shadow-[0_8px_24px_-6px_rgb(0_0_0/0.18)] transition-all duration-200 lg:hidden',
          isCtaScrolledPast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
          hasTabBar
            ? 'bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] md:bottom-4'
            : 'bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]',
        )}
      >
        {hasEnrollment ? (
          <CourseCta course={selectedCourse} />
        ) : (
          <EnrolButton course={selectedCourse} plan={selectedPlan} />
        )}
      </div>
    </div>
  );
};
