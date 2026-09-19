import { RectangleSkeleton } from '@repo/ui/app';

/** The material page while its data is on the way: the header's shape and three content rows. */
export const StudyMaterialSkeleton = () => (
  <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading study material">
    <div className="rounded-lg border border-border bg-background px-5 py-5">
      <RectangleSkeleton height={12} width="20%" />
      <div className="mt-2">
        <RectangleSkeleton height={24} width="40%" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <RectangleSkeleton key={index} height={60} width="100%" />
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-lg border border-border bg-background px-4 py-3">
          <RectangleSkeleton height={12} width="30%" />
          <div className="mt-2">
            <RectangleSkeleton height={16} width="55%" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
