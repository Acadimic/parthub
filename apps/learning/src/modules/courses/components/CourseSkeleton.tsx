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

/**
 * Mirrors the learning view, with the frame at its real height so nothing jumps when the lesson
 * arrives: the top bar, the lesson column, and the outline pane on the right.
 */
export const CourseModulesSkeleton = () => (
  <div className="flex h-[100vh] animate-pulse">
    <div className="flex min-w-0 flex-1 flex-col bg-muted/40">
      <div className="shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3 md:px-6">
          <RectangleSkeleton height={28} width={96} />
          <div className="flex-1" />
          <RectangleSkeleton height={28} width={28} />
          <RectangleSkeleton height={28} width={28} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
          {/* The one line above the frame: module and lesson name, then the kind and duration. */}
          <div className="flex items-center justify-between gap-4 px-1">
            <RectangleSkeleton height={16} width="45%" />
            <div className="flex items-center gap-3">
              <RectangleSkeleton height={22} width={64} />
              <RectangleSkeleton height={12} width={44} />
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="h-[62vh] min-h-[360px] md:h-[640px]">
              <RectangleSkeleton />
            </div>
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
              <RectangleSkeleton height={28} width={88} />
              <RectangleSkeleton height={28} width={160} />
            </div>
          </div>
          {/* Mark complete and the reactions, then the teacher. */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 md:p-5">
            <div className="flex items-center justify-between gap-4">
              <RectangleSkeleton height={36} width={160} />
              <div className="flex gap-2">
                <RectangleSkeleton height={32} width={64} />
                <RectangleSkeleton height={32} width={64} />
                <RectangleSkeleton height={32} width={64} />
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <RectangleSkeleton height={40} width={40} />
              <div className="flex flex-1 flex-col gap-1.5">
                <RectangleSkeleton height={10} width={56} />
                <RectangleSkeleton height={14} width="40%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <aside className="hidden w-[360px] shrink-0 flex-col border-l border-border bg-background lg:flex xl:w-[400px]">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4">
        <div className="flex flex-col gap-1.5">
          <RectangleSkeleton height={10} width={48} />
          <RectangleSkeleton height={14} width="70%" />
        </div>
        <RectangleSkeleton height={8} />
      </div>
      <div className="p-4">
        <OutlineSkeleton rows={8} />
      </div>
    </aside>
  </div>
);
