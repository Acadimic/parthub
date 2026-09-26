import { CourseCard } from '@modules/courses/components/CourseCard';
import { type ICourse, useCourseLookups, useSelectedUser } from '@stores';
import { useEffect } from 'react';
import { SectionHeading } from '@components/app/sections';

/** How many started courses the strip shows; the activity page lists them all. */
const MAX_CARDS = 3;

const getCourseTotal = (course: ICourse) =>
  (course.stats?.videosCount ?? 0) + (course.stats?.readingsCount ?? 0) + (course.stats?.testsCount ?? 0);

/** For a signed-in learner with something underway: the way straight back in. Renders nothing otherwise. */
export const ContinueLearning = () => {
  const selectedUser = useSelectedUser();
  const { getCourses, getCompletedModules, loadCompletedModules } = useCourseLookups();

  useEffect(() => {
    if (selectedUser && !selectedUser.isLoadedCompletedModules) loadCompletedModules();
  }, [selectedUser?._id]);

  if (!selectedUser) return null;

  const completed = getCompletedModules().filter((row) => row.isCompleted);
  const countByCourse = completed.reduce<Record<string, number>>((counts, row) => {
    counts[row.course] = (counts[row.course] ?? 0) + 1;
    return counts;
  }, {});
  const latestByCourse = completed.reduce<Record<string, string>>((latest, row) => {
    const at = row.updatedAt ?? row.createdAt ?? '';
    if (at > (latest[row.course] ?? '')) latest[row.course] = at;
    return latest;
  }, {});
  const started = getCourses()
    .filter((course) => countByCourse[course._id])
    .sort((a, b) => (latestByCourse[b._id] ?? '').localeCompare(latestByCourse[a._id] ?? ''))
    .slice(0, MAX_CARDS);

  if (!started.length) return null;

  return (
    <section className="flex flex-col gap-6 py-12 md:py-16">
      <SectionHeading
        eyebrow="Welcome back"
        title="Pick up where you left off"
        subtitle="The courses you have started, most recent first."
        action={{ label: 'Your activity', href: '/activity' }}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {started.map((course) => {
          const total = getCourseTotal(course);
          const progress = total ? Math.min(100, (countByCourse[course._id] / total) * 100) : 0;
          return <CourseCard key={course._id} course={course} progress={progress} />;
        })}
      </div>
    </section>
  );
};
