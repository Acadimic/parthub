import { RectangleSkeleton } from '@repo/ui/app';
import { Container } from '@components/others';

const OutlineSkeleton = ({ rows }: { rows: number }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center gap-3">
        <RectangleSkeleton width={32} height={32} />
        <div className="flex flex-1 flex-col gap-1.5">
          <RectangleSkeleton height={14} width="70%" />
          <RectangleSkeleton height={10} width="40%" />
        </div>
      </div>
    ))}
  </div>
);

/** Mirrors the preview page: a banner, the summary card, and the syllabus. */
export const CoursePreviewSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-muted">
      <Container>
        <div className="grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-4">
            <RectangleSkeleton height={20} width={160} />
            <RectangleSkeleton height={40} width="80%" />
            <RectangleSkeleton height={16} width="60%" />
            <div className="flex gap-2">
              <RectangleSkeleton height={28} width={90} />
              <RectangleSkeleton height={28} width={90} />
            </div>
          </div>
          <RectangleSkeleton height={220} />
        </div>
      </Container>
    </div>
    <Container>
      <div className="grid gap-8 py-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <RectangleSkeleton height={24} width={200} />
          <OutlineSkeleton rows={5} />
        </div>
        <RectangleSkeleton height={160} />
      </div>
    </Container>
  </div>
);

/** Mirrors the learning view: the content frame on the left, the outline on the right. */
export const CourseModulesSkeleton = () => (
  <div className="flex animate-pulse">
    <div className="flex-1 px-4 py-4 md:px-6">
      <RectangleSkeleton height={14} width={260} />
      <div className="mt-4">
        <RectangleSkeleton height={420} />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <RectangleSkeleton height={22} width="50%" />
        <RectangleSkeleton height={12} width="30%" />
      </div>
    </div>
    <div className="hidden w-[360px] shrink-0 border-l border-border p-4 lg:block">
      <RectangleSkeleton height={18} width="60%" />
      <div className="mt-2">
        <RectangleSkeleton height={8} />
      </div>
      <div className="mt-6">
        <OutlineSkeleton rows={6} />
      </div>
    </div>
  </div>
);
