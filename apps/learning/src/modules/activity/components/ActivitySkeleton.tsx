import { RectangleSkeleton } from '@repo/ui/app';

const TileSkeleton = () => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
    <RectangleSkeleton width={36} height={36} />
    <div className="flex flex-1 flex-col gap-1.5">
      <RectangleSkeleton width="40%" height={16} />
      <RectangleSkeleton width="70%" height={10} />
    </div>
  </div>
);

const HeatmapSkeleton = () => (
  <div className="rounded-xl border border-border bg-background p-4 md:p-5">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex flex-col gap-1.5">
        <RectangleSkeleton width={100} height={14} />
        <RectangleSkeleton width={140} height={10} />
      </div>
      <RectangleSkeleton width={90} height={10} />
    </div>
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
      <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridAutoColumns: '1rem' }}>
        {Array.from({ length: 91 }).map((_, index) => (
          <RectangleSkeleton key={index} width={16} height={16} />
        ))}
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2">
            <RectangleSkeleton width="45%" height={16} />
            <RectangleSkeleton width="70%" height={10} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CourseCardSkeleton = () => (
  <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-1 flex-col gap-1.5">
        <RectangleSkeleton width="80%" height={14} />
        <RectangleSkeleton width="50%" height={10} />
      </div>
      <RectangleSkeleton width={40} height={20} />
    </div>
    <RectangleSkeleton height={8} />
    <div className="flex items-center justify-between">
      <RectangleSkeleton width={90} height={10} />
      <RectangleSkeleton width={70} height={14} />
    </div>
  </div>
);

const EventSkeleton = () => (
  <li className="flex gap-4 pb-6 last:pb-0">
    <RectangleSkeleton width={32} height={32} />
    <div className="flex flex-1 flex-col gap-2 rounded-lg border border-border bg-background px-4 py-3">
      <RectangleSkeleton width="30%" height={10} />
      <RectangleSkeleton width="60%" height={14} />
      <RectangleSkeleton width="45%" height={10} />
    </div>
  </li>
);

/** Placeholders shaped like the overview, so the page does not jump when the data lands. */
export const ActivitySkeleton = () => (
  <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading your activity">
    <div className="flex gap-6 border-b border-border pb-3">
      <RectangleSkeleton width={90} height={16} />
      <RectangleSkeleton width={80} height={16} />
      <RectangleSkeleton width={60} height={16} />
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <TileSkeleton key={index} />
      ))}
    </div>
    <HeatmapSkeleton />
    <section className="flex flex-col gap-3">
      <RectangleSkeleton width={120} height={20} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </section>
    <section className="flex flex-col gap-3">
      <RectangleSkeleton width={140} height={20} />
      <ul>
        {Array.from({ length: 3 }).map((_, index) => (
          <EventSkeleton key={index} />
        ))}
      </ul>
    </section>
  </div>
);
