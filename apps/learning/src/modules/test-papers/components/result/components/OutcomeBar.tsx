import { cn } from '@repo/ui/lib';
import { type Marking } from '@enums';
import { type IResultAnalytics } from '../useResultAnalytics';
import { formatMarks } from '../analytics';
import { MARKING_BG_CLASSES, MARKING_ICONS, MARKING_LABELS, MARKING_ORDER, MARKING_TEXT_CLASSES } from '../graphs';
import { ResultCard } from './ResultCard';

interface IProps {
  analytics: IResultAnalytics;
}

/**
 * How the paper split: one bar of the four outcomes, with each outcome's count, share and marks
 * under it. Outcomes that did not occur are left out, so a paper with no partial marking shows three.
 */
export const OutcomeBar = ({ analytics }: IProps) => {
  const { counts, questions, marks } = analytics;
  const total = questions.length;
  const present = MARKING_ORDER.filter((marking) => counts[marking] > 0);
  const share = (marking: Marking) => (total ? Math.round((counts[marking] / total) * 100) : 0);

  return (
    <ResultCard title="How the paper went" description="Every question by outcome">
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {present.map((marking) => (
          <div
            key={marking}
            role="img"
            aria-label={`${MARKING_LABELS[marking]}: ${counts[marking]} of ${total}`}
            title={`${MARKING_LABELS[marking]}: ${counts[marking]} (${share(marking)}%)`}
            className={cn('h-full min-w-[4px]', MARKING_BG_CLASSES[marking])}
            style={{ flexGrow: counts[marking] }}
          />
        ))}
      </div>
      <div className={cn('mt-5 grid grid-cols-2 gap-3', present.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4')}>
        {present.map((marking) => {
          const MarkingIcon = MARKING_ICONS[marking];
          return (
            <div key={marking} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MarkingIcon weight="bold" className={cn('h-3.5 w-3.5', MARKING_TEXT_CLASSES[marking])} />
                {MARKING_LABELS[marking]}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-semibold text-foreground">{counts[marking]}</span>
                <span className="text-xs text-muted-foreground">{share(marking)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Marks earned</dt>
          <dd className={cn('font-mono font-semibold', marks.earned > 0 ? 'text-success' : 'text-foreground')}>
            {formatMarks(marks.earned)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Lost to wrong answers</dt>
          <dd className={cn('font-mono font-semibold', marks.lost < 0 ? 'text-destructive' : 'text-foreground')}>
            {marks.lost}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Not attempted</dt>
          <dd className="font-mono font-semibold text-foreground">{marks.skipped}</dd>
        </div>
      </dl>
    </ResultCard>
  );
};
