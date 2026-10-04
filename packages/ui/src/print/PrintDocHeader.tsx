import { cn } from '../lib/cn';

export interface IPrintStat {
  value: string | number;
  label: string;
}

interface IProps {
  /** The small line above the title: "Quiz · Class 11 · Physics". */
  eyebrow: string;
  title: string;
  /** The tiles on the right, in reading order; a tile without a value is left out by the caller. */
  stats: IPrintStat[];
  /** `large` opens a printout of its own; `small` heads a quiz inside a course. */
  size: 'large' | 'small';
}

/** The block that opens a paper or a module: label, title and a few figures, over a heavy rule. */
/** Past three tiles the title would be squeezed into a column, so the tiles go on a row beneath it. */
const MAX_SIDE_STATS = 3;

export const PrintDocHeader = ({ eyebrow, title, stats, size }: IProps) => (
  <div
    className={cn(
      'grid gap-6 border-b-2 border-foreground pb-5 break-inside-avoid',
      stats.length > MAX_SIDE_STATS ? 'grid-cols-1 gap-y-4' : 'grid-cols-[1fr_auto] items-end',
      // A phone stacks the title over the tiles whatever their count; print never matches max-sm.
      'max-sm:grid-cols-1 max-sm:gap-y-4',
    )}
  >
    <div>
      <p className="text-[8.5pt] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      <h2
        className={cn(
          'mt-1.5 font-extrabold leading-tight max-sm:text-[18pt]',
          size === 'large' ? 'text-[22pt]' : 'text-[16pt]',
        )}
      >
        {title}
      </h2>
    </div>
    <div className="flex gap-2.5 max-sm:gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="min-w-[24mm] rounded-xl border border-border px-4 py-2.5 text-center max-sm:min-w-0 max-sm:flex-1 max-sm:px-1"
        >
          <b className="block text-[15pt] font-extrabold leading-tight">{stat.value}</b>
          <span className="text-[7pt] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  </div>
);
