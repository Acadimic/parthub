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

/** A skeleton block with its own corner radius; `RectangleSkeleton` is always lightly rounded. */
const Pill = ({ className }: { className: string }) => (
  <div className={`shrink-0 overflow-hidden ${className}`}>
    <RectangleSkeleton />
  </div>
);

/** The outline's module rows: a numbered circle, the module name and its progress line. */
const ModuleRowsSkeleton = ({ rows }: { rows: number }) => (
  <div className="flex flex-col">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Pill className="h-7 w-7 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <RectangleSkeleton height={14} width={`${85 - (index % 3) * 15}%`} />
          <RectangleSkeleton height={10} width={72} />
        </div>
        <RectangleSkeleton height={12} width={12} />
      </div>
    ))}
  </div>
);

/**
 * Mirrors the learning view as it lays out now, so nothing jumps when the lesson arrives: the top
 * bar, the lesson filling the height left under its header with the actions in its footer, and
 * the outline pane from `lg` up. The footer wraps on a phone the way the real one does.
 */
export const CourseModulesSkeleton = () => (
  <div className="flex h-[100dvh] animate-pulse" aria-busy="true" aria-label="Loading the lesson">
    <div className="flex min-w-0 flex-1 flex-col bg-muted/40">
      {/* Top bar: back to the overview, the trail (or the course and progress on a phone), account. */}
      <div className="shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3 md:px-6">
          <RectangleSkeleton height={28} width={32} />
          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            <RectangleSkeleton height={12} width={56} />
            <RectangleSkeleton height={12} width={64} />
            <RectangleSkeleton height={12} width="35%" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:hidden">
            <RectangleSkeleton height={14} width="70%" />
            <RectangleSkeleton height={10} width={64} />
          </div>
          <Pill className="h-8 w-16 rounded-md lg:hidden" />
          <Pill className="h-9 w-9 rounded-full" />
          <Pill className="hidden h-8 w-8 rounded-full lg:block" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
          {/* The line above the frame: module and lesson, then the content kinds and duration. */}
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <RectangleSkeleton height={12} width={64} />
              <div className="hidden flex-1 sm:block">
                <RectangleSkeleton height={16} width="60%" />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Pill className="h-6 w-6 rounded-md" />
              <Pill className="h-6 w-6 rounded-md" />
              <Pill className="h-6 w-16 rounded-md" />
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            {/* The lesson: a title and a few paragraphs, so the frame reads as text loading. */}
            <div className="flex min-h-[240px] flex-1 flex-col gap-3 overflow-hidden px-4 pt-6 md:px-8">
              <RectangleSkeleton height={28} width="55%" />
              <RectangleSkeleton height={14} />
              <RectangleSkeleton height={14} width="92%" />
              <RectangleSkeleton height={14} width="80%" />
              <div className="h-3" />
              <RectangleSkeleton height={20} width="30%" />
              <RectangleSkeleton height={14} />
              <RectangleSkeleton height={14} width="88%" />
              <div className="mt-2 h-40 shrink-0">
                <RectangleSkeleton />
              </div>
            </div>
            {/* The footer: mark complete and the reactions, then full screen and the pager. */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border px-2 py-2 md:px-3">
              <Pill className="h-9 w-full rounded-full sm:w-[200px]" />
              <Pill className="h-9 w-[104px] rounded-full" />
              <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-1.5">
                <Pill className="h-8 w-8 rounded-full" />
                <Pill className="h-8 w-8 rounded-full" />
                <div className="hidden sm:block">
                  <RectangleSkeleton height={12} width={36} />
                </div>
                <Pill className="h-9 w-24 rounded-full sm:w-56" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <aside className="hidden w-[360px] shrink-0 flex-col border-l border-border bg-background lg:flex xl:w-[400px]">
      {/* The course, its overview link and progress. */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <RectangleSkeleton height={10} width={48} />
            <RectangleSkeleton height={14} width="75%" />
          </div>
          <RectangleSkeleton height={12} width={56} />
        </div>
        <div className="flex items-center gap-3">
          <Pill className="h-2 flex-1 rounded-full" />
          <RectangleSkeleton height={10} width={36} />
        </div>
      </div>
      {/* Contents, Tests and Live classes, then the list's summary line. */}
      <div className="flex items-center gap-4 border-b border-border px-4 py-2.5">
        <RectangleSkeleton height={12} width={72} />
        <RectangleSkeleton height={12} width={48} />
        <RectangleSkeleton height={12} width={84} />
      </div>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <RectangleSkeleton height={10} width={120} />
        <RectangleSkeleton height={10} width={72} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <ModuleRowsSkeleton rows={9} />
      </div>
    </aside>
  </div>
);
