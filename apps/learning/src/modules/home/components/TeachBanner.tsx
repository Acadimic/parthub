import { Link } from '@repo/ui/app';
import { ArrowUpRightIcon, CheckCircleIcon } from '@phosphor-icons/react';

const POINTS = [
  'Plan a course by day and fill it with readings, videos and tests',
  'Marked papers and analytics for every student, automatically',
  'Publish to the catalogue and reach learners across organisations',
];

/** The other side of the marketplace: an invitation to the teaching app. */
export const TeachBanner = () => (
  <section className="py-12 md:py-16">
    <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-primary-foreground md:px-12 md:py-14">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-16 select-none font-mono text-[14rem] font-bold leading-none opacity-10"
      >
        A
      </span>
      <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-caps opacity-80">For teachers</div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Teach on Acadimic</h2>
          <p className="mt-3 max-w-xl opacity-90">
            Bring your course, your students, or both. The teaching app gives you the tools to build a course that
            learners can actually follow.
          </p>
          <ul className="mt-5 flex flex-col gap-2">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm">
                <CheckCircleIcon weight="fill" className="mt-0.5 h-4 w-4 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex lg:justify-end">
          <Link
            href="https://teach.acadimic.com"
            target="_blank"
            className="bg-background px-6 py-3 text-foreground hover:bg-background/90"
            rightsection={<ArrowUpRightIcon weight="bold" className="h-4 w-4" />}
          >
            Open the teaching app
          </Link>
        </div>
      </div>
    </div>
  </section>
);
