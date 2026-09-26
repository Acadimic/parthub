import { LogoTile } from '@components/app/attachments';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { useCourseLookups, useStandardLookups } from '@stores';
import { getPlural } from '@utils/helpers';
import Link from 'next/link';
import { SectionHeading } from '@components/app/sections';

/** How many standards the grid shows; the rest are a click away on the catalogue. */
const MAX_TILES = 12;

/** The standards that have courses, as tiles into the filtered catalogue. */
export const StandardsGrid = () => {
  const { getStandards } = useStandardLookups();
  const { getCourses } = useCourseLookups();
  const counts = getCourses().reduce<Record<string, number>>((result, course) => {
    (course.standards ?? []).forEach((id) => (result[id] = (result[id] ?? 0) + 1));
    return result;
  }, {});
  const standards = getStandards()
    .filter((standard) => counts[standard._id])
    .sort((a, b) => counts[b._id] - counts[a._id])
    .slice(0, MAX_TILES);

  if (!standards.length) return null;

  return (
    <section className="flex flex-col gap-6 py-12 md:py-16">
      <SectionHeading
        eyebrow="Browse"
        title="Find your standard"
        subtitle="Every course is catalogued under the class or exam it prepares you for."
        action={{ label: 'All standards', href: '/courses' }}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {standards.map((standard) => (
          <Link
            key={standard._id}
            href={{ pathname: '/courses', query: { standard: standard._id } }}
            className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <LogoTile url={standard.logo} name={standard.name} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold group-hover:text-primary">{standard.name}</span>
              <span className="block text-xs text-muted-foreground">
                {counts[standard._id]} {getPlural(counts[standard._id], 'course')}
              </span>
            </span>
            <ArrowRightIcon
              weight="bold"
              className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100"
            />
          </Link>
        ))}
      </div>
    </section>
  );
};
