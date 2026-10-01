import { RectangleSkeleton } from '@repo/ui/app';

interface IProps {
  /** Practice has no clock and no "mark for review", so those placeholders are left out. */
  isPractice: boolean;
}

const Circle = ({ size }: { size: number }) => (
  <div className="shrink-0 animate-pulse rounded-full bg-accent" style={{ width: size, height: size }} />
);

const OptionRow = ({ width }: { width: string }) => (
  <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-3">
    <Circle size={20} />
    <RectangleSkeleton width={14} height={12} />
    <RectangleSkeleton width={width} height={14} />
  </div>
);

const Header = ({ isPractice }: IProps) => (
  <header className="h-14 border-b border-border bg-background xl:h-16">
    <div className="flex h-full items-center gap-2 px-3 md:gap-3 md:px-6">
      <RectangleSkeleton width={64} height={22} />
      <div className="min-w-0 flex-1">
        <RectangleSkeleton width="45%" height={16} />
      </div>
      {isPractice ? null : <RectangleSkeleton width={88} height={30} />}
      <Circle size={32} />
      <Circle size={32} />
    </div>
  </header>
);

const Palette = () => (
  <aside className="hidden h-full w-[380px] flex-col border-l border-border bg-background xl:flex">
    <div className="border-b border-border px-4 py-4">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <RectangleSkeleton width={24} height={24} />
            <RectangleSkeleton width="60%" height={10} />
          </div>
        ))}
      </div>
      <div className="mt-3">
        <RectangleSkeleton width={120} height={14} />
      </div>
    </div>
    <div className="min-h-0 flex-1 px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <RectangleSkeleton width={80} height={22} />
        <RectangleSkeleton width={70} height={10} />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="flex justify-center">
            <RectangleSkeleton width={36} height={36} />
          </div>
        ))}
      </div>
    </div>
    {/* The submit button's place, the same height as the question footer beside it. */}
    <div className="flex h-14 shrink-0 items-center border-t border-border px-4 xl:h-16">
      <RectangleSkeleton width="100%" height={36} />
    </div>
  </aside>
);

/** Previous, the quiet answer actions, Next — and the finish button only where the palette is not a pane. */
const Footer = ({ isPractice }: IProps) => (
  <div className="h-14 shrink-0 border-t border-border bg-background xl:h-16">
    <div className="flex h-full items-center gap-2 px-3 md:gap-3 md:px-6">
      <RectangleSkeleton width={96} height={36} />
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        {isPractice ? null : <RectangleSkeleton width={120} height={28} />}
        <RectangleSkeleton width={72} height={28} />
      </div>
      <RectangleSkeleton width={88} height={36} />
      <div className="xl:hidden">
        <RectangleSkeleton width={110} height={36} />
      </div>
    </div>
  </div>
);

/**
 * The sitting's frame, before the paper has arrived: the same header, question card, palette and
 * footer, in the same places, so nothing moves when the first question lands.
 */
export const ExamSkeleton = ({ isPractice }: IProps) => (
  <div className="relative bg-muted" aria-busy="true" aria-label="Loading the paper">
    <div className="fixed top-0 z-10 w-full">
      <Header isPractice={isPractice} />
    </div>
    <div className="h-[100vh] overflow-hidden pt-14 xl:pt-16">
      <div className="flex h-full w-full justify-between overflow-x-hidden">
        <div className="flex min-w-0 grow flex-col md:w-[calc(100%-360px)]">
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3 md:px-8 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <RectangleSkeleton width={56} height={12} />
                <RectangleSkeleton width={90} height={22} />
                <RectangleSkeleton width={90} height={22} />
              </div>
              <div className="xl:hidden">
                <RectangleSkeleton width={72} height={28} />
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3 md:px-6">
                <div className="flex items-center gap-3">
                  <RectangleSkeleton width={120} height={18} />
                  <RectangleSkeleton width={90} height={22} />
                </div>
                <div className="flex items-center gap-2">
                  <RectangleSkeleton width={36} height={22} />
                  <RectangleSkeleton width={36} height={22} />
                  <Circle size={28} />
                </div>
              </div>
              <div className="px-4 py-4 md:px-6 md:py-5">
                <div className="flex flex-col gap-2.5">
                  <RectangleSkeleton width="90%" height={16} />
                  <RectangleSkeleton width="75%" height={16} />
                  <RectangleSkeleton width="40%" height={16} />
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <OptionRow width="55%" />
                  <OptionRow width="40%" />
                  <OptionRow width="65%" />
                  <OptionRow width="35%" />
                </div>
              </div>
            </div>
          </div>
          <Footer isPractice={isPractice} />
        </div>
        <Palette />
      </div>
    </div>
  </div>
);
