import { cn } from '@repo/ui/lib';
import { type Marking } from '@enums';
import { MARKING_BG_CLASSES, MARKING_LABELS } from './chart-theme';

interface IProps {
  markings: Marking[];
  className?: string;
}

/** Which colour is which outcome, under a chart. Always present, since colour alone is not enough. */
export const MarkingLegend = ({ markings, className }: IProps) => (
  <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground', className)}>
    {markings.map((marking) => (
      <span key={marking} className="flex items-center gap-1.5">
        <span className={cn('inline-block h-2.5 w-2.5 rounded-sm', MARKING_BG_CLASSES[marking])} />
        {MARKING_LABELS[marking]}
      </span>
    ))}
  </div>
);
