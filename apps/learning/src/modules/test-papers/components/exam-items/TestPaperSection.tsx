import { Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { type ITestPaperSection } from '@stores';

/**
 * One colour per section, from the theme's chart palette, so a section reads the same in the
 * strip above the question and in the palette beside it. Every state is a translucent tint, never a
 * solid fill: the current section only deepens its tint and ring. Written out in full for
 * Tailwind's purge.
 */
const SECTION_TONES = [
  {
    idle: 'from-chart-1/15 to-chart-1/5 text-chart-1 ring-chart-1/20',
    active: 'from-chart-1/30 to-chart-1/10 text-chart-1 ring-chart-1/50',
    dot: 'bg-chart-1',
  },
  {
    idle: 'from-chart-2/15 to-chart-2/5 text-chart-2 ring-chart-2/20',
    active: 'from-chart-2/30 to-chart-2/10 text-chart-2 ring-chart-2/50',
    dot: 'bg-chart-2',
  },
  {
    idle: 'from-chart-3/15 to-chart-3/5 text-chart-3 ring-chart-3/20',
    active: 'from-chart-3/30 to-chart-3/10 text-chart-3 ring-chart-3/50',
    dot: 'bg-chart-3',
  },
  {
    idle: 'from-chart-4/15 to-chart-4/5 text-chart-4 ring-chart-4/20',
    active: 'from-chart-4/30 to-chart-4/10 text-chart-4 ring-chart-4/50',
    dot: 'bg-chart-4',
  },
  {
    idle: 'from-chart-5/15 to-chart-5/5 text-chart-5 ring-chart-5/20',
    active: 'from-chart-5/30 to-chart-5/10 text-chart-5 ring-chart-5/50',
    dot: 'bg-chart-5',
  },
];

interface IProps {
  section: ITestPaperSection;
  /** The section's place in the paper, which picks its colour; the palette repeats after five. */
  index: number;
  /** Holds the question on screen: a deeper tint and ring, and a pulsing dot. */
  isActive: boolean;
}

export const TestPaperSection = ({ section, index, isActive }: IProps) => {
  const tone = SECTION_TONES[index % SECTION_TONES.length];
  return (
    <Tooltip title={section.name}>
      <span
        aria-current={isActive ? 'true' : undefined}
        className={cn(
          'flex w-fit max-w-[200px] items-center gap-1.5 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset backdrop-blur-sm transition-all duration-200',
          isActive ? tone.active : tone.idle,
        )}
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {isActive ? (
            <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', tone.dot)} />
          ) : null}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', tone.dot)} />
        </span>
        <span className="truncate">{section.name}</span>
      </span>
    </Tooltip>
  );
};
