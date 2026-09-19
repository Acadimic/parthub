import { RectangleSkeleton } from '@repo/ui/app';

/** The course page while its data is on the way: the header's shape and two module rows. */
export const CourseSkeleton = () => (
  <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading course">
    <div className="rounded-lg border border-border bg-background px-5 py-5">
      <div className="flex items-start gap-4">
        <RectangleSkeleton height={64} width={64} />
        <div className="flex-1">
          <RectangleSkeleton height={12} width="15%" />
          <div className="mt-2">
            <RectangleSkeleton height={24} width="45%" />
          </div>
          <div className="mt-2">
            <RectangleSkeleton height={12} width="30%" />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <RectangleSkeleton key={index} height={60} width="100%" />
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-2">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="rounded-lg border border-border bg-background px-4 py-3">
          <RectangleSkeleton height={12} width="30%" />
          <div className="mt-2">
            <RectangleSkeleton height={16} width="50%" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
