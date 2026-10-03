import { Link, RectangleSkeleton } from '@repo/ui/app';
import { Chip, TextInput } from '@repo/ui/core';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useCourseLookups, useSelectedUser, useStandardLookups } from '@stores';
import { useRouter } from 'next/router';
import { type SubmitEvent, useState } from 'react';
import banner from '../assets/banner.webp';

/** How many standards to offer as one-tap searches under the box. */
const QUICK_PICKS = 4;

const Stat = ({ value, label, isLoading }: { value: number; label: string; isLoading: boolean }) => (
  <div className="flex flex-col">
    {isLoading ? (
      <RectangleSkeleton width={56} height={28} />
    ) : (
      <span className="font-mono text-2xl font-semibold leading-7">{value.toLocaleString()}</span>
    )}
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

/**
 * The opening screen: what the platform is, a search box that lands on the catalogue, the
 * standards with the most courses as one-tap searches, and live counts from the catalogue itself.
 */
export const Hero = () => {
  const { push } = useRouter();
  const [query, setQuery] = useState('');
  const selectedUser = useSelectedUser();
  const courseStore = useCourseLookups();
  const { getStandards } = useStandardLookups();
  const courses = courseStore.getCourses();
  const isLoading = courseStore.isLoading('courses');

  const countByStandard = courses.reduce<Record<string, number>>((counts, course) => {
    (course.standards ?? []).forEach((id) => (counts[id] = (counts[id] ?? 0) + 1));
    return counts;
  }, {});
  const quickPicks = getStandards()
    .filter((standard) => countByStandard[standard._id])
    .sort((a, b) => countByStandard[b._id] - countByStandard[a._id])
    .slice(0, QUICK_PICKS);
  const lessons = courses.reduce(
    (sum, course) => sum + (course.stats?.videosCount ?? 0) + (course.stats?.readingsCount ?? 0),
    0,
  );
  const tests = courses.reduce((sum, course) => sum + (course.stats?.testsCount ?? 0), 0);

  const search = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    push(q ? { pathname: '/courses', query: { q } } : '/courses');
  };

  return (
    <section>
      <div className="grid grid-cols-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
        <div className="order-2 lg:order-1">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Courses from teachers and institutions, in one place
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl xl:text-6xl">
            Learn it properly, <span className="text-primary">test it honestly.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Day-by-day courses with readings, videos, live sessions and marked test papers, built by teachers for the
            standard you are studying.
          </p>
          <form onSubmit={search} role="search" className="mt-8 max-w-xl">
            <TextInput
              type="search"
              value={query}
              placeholder="Search courses…"
              aria-label="Search courses"
              inputClassName="py-2.5 text-base"
              leftSection={<MagnifyingGlassIcon weight="bold" className="h-5 w-5 text-muted-foreground" />}
              rightSection={
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                >
                  Search
                </button>
              }
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>
          {quickPicks.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Popular:</span>
              {quickPicks.map((standard) => (
                <Chip
                  key={standard._id}
                  label={standard.name}
                  className="px-3 py-1 text-xs"
                  onClick={() => push({ pathname: '/courses', query: { standard: standard._id } })}
                />
              ))}
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {selectedUser ? (
              <>
                <Link className="px-6 py-3" href="/courses">
                  Browse courses
                </Link>
                <Link isSecondary className="px-6 py-3 text-foreground" href="/activity">
                  Your activity
                </Link>
              </>
            ) : (
              <>
                <Link className="px-6 py-3" href="/sign-up">
                  Join for free
                </Link>
                <Link isSecondary className="px-6 py-3 text-foreground" href="/courses">
                  Browse courses
                </Link>
              </>
            )}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-6 sm:grid-cols-4 sm:gap-8">
            <Stat value={courses.length} label="Courses" isLoading={isLoading} />
            <Stat value={lessons} label="Lessons" isLoading={isLoading} />
            <Stat value={tests} label="Test papers" isLoading={isLoading} />
            <Stat value={getStandards().length} label="Standards" isLoading={!getStandards().length} />
          </div>
        </div>
        <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
          {/* A transparent cut-out, so it carries no frame: a ring or shadow would trace the empty
              corners rather than the subject. Intrinsic size is set because this is the LCP element
              and the copy beside it would otherwise shift as the image decodes. Imported rather than
              served from `public/`: the import gets a hashed URL cached for a year, where `public/`
              is served with `max-age=0` and the banner was fetched again on every return home. */}
          <img
            src={banner.src}
            alt="A teacher discussing a book with a student"
            width={banner.width}
            height={banner.height}
            loading="eager"
            fetchPriority="high"
            className="h-auto w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[512px]"
          />
        </div>
      </div>
    </section>
  );
};
