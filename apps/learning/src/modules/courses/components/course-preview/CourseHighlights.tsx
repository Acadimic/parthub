import { CheckCircleIcon, SealCheckIcon } from '@phosphor-icons/react';
import { type ICourse } from '@stores';

interface IProps {
  course: ICourse;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>
);

/**
 * The teacher-written promises of the course — outcomes, prerequisites and outline. Each section
 * renders only when the course carries it, so an older course without them shows nothing here.
 */
export const CourseHighlights = ({ course }: IProps) => {
  const outcomes = course.outcomes ?? [];
  const prerequisites = course.prerequisites ?? [];
  const outline = course.outline ?? [];

  if (!outcomes.length && !prerequisites.length && !outline.length) return null;

  return (
    <div className="flex flex-col gap-8">
      {outcomes.length ? (
        <Section title="What you'll learn">
          <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-2.5 text-sm">
                <CheckCircleIcon weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {outline.length ? (
        <Section title="Course outline">
          <ol className="flex flex-col gap-2">
            {outline.map((entry, index) => (
              <li key={entry} className="flex items-start gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <span className="pt-0.5">{entry}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}
      {prerequisites.length ? (
        <Section title="Before you start">
          <ul className="flex flex-col gap-2">
            {prerequisites.map((prerequisite) => (
              <li key={prerequisite} className="flex items-start gap-2.5 text-sm">
                <SealCheckIcon weight="bold" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{prerequisite}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
};
