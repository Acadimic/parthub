import { cn } from '@repo/ui/lib';
import { type IActivityDay } from '@interfaces';
import { getStringFormattedDate } from '@utils/helpers';
import dayjs from 'dayjs';

/** Cell fill by how much happened that day; the primary hue, deeper the busier. */
const getCellClass = (count: number) => {
  if (count === 0) return 'bg-muted';
  if (count === 1) return 'bg-primary/30';
  if (count <= 3) return 'bg-primary/60';
  return 'bg-primary';
};

const LEGEND = [0, 1, 2, 4];

const pluralActivities = (count: number) => (count === 1 ? '1 activity' : `${count} activities`);

/** Consecutive active days ending today (or yesterday, so a streak survives until midnight). */
const getCurrentStreak = (days: IActivityDay[]) => {
  const reversed = [...days].reverse();
  const start = reversed[0]?.count === 0 ? 1 : 0;
  let streak = 0;
  for (const day of reversed.slice(start)) {
    if (day.count === 0) break;
    streak += 1;
  }
  return streak;
};

const getLongestStreak = (days: IActivityDay[]) => {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    current = day.count > 0 ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
};

const Fact = ({ value, label }: { value: string; label: string }) => (
  <div className="rounded-lg bg-muted/40 px-3 py-2">
    <div className="font-mono text-base font-semibold leading-6">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

/**
 * Twelve weeks of days, one square each, laid out in columns of seven like a calendar. The first
 * column is padded so every column starts on a Sunday and the last one ends today. Beside it, the
 * facts the grid is there to show: streaks and the busiest day.
 */
export const ActivityHeatmap = ({ days }: { days: IActivityDay[] }) => {
  const leadingBlanks = days.length ? dayjs(days[0].date).day() : 0;
  const cells: (IActivityDay | null)[] = [...Array.from({ length: leadingBlanks }, () => null), ...days];
  const activeDays = days.filter((day) => day.count > 0).length;
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const busiest = days.reduce<IActivityDay | null>(
    (best, day) => (day.count > 0 && (!best || day.count > best.count) ? day : best),
    null,
  );
  const weeks = Math.ceil(cells.length / 7);
  // A month label above the first column that starts in that month.
  const monthLabels = Array.from({ length: weeks }, (_, week) => {
    const first = cells.slice(week * 7, week * 7 + 7).find((day) => day !== null);
    if (!first) return '';
    const date = dayjs(first.date);
    return week === 0 || date.date() <= 7 ? date.format('MMM') : '';
  });

  return (
    <div className="rounded-xl border border-border bg-background p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Last 12 weeks</div>
          <div className="text-xs text-muted-foreground">
            {pluralActivities(total)} on {activeDays} {activeDays === 1 ? 'day' : 'days'}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xxs text-muted-foreground">
          Less
          {LEGEND.map((count) => (
            <span key={count} className={cn('h-2.5 w-2.5 rounded-sm', getCellClass(count))} />
          ))}
          More
        </div>
      </div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 overflow-x-auto">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks}, 1rem)` }}>
            {monthLabels.map((label, index) => (
              <span key={index} className="h-4 whitespace-nowrap text-xxs text-muted-foreground">
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridAutoColumns: '1rem' }}>
            {cells.map((day, index) =>
              day ? (
                <span
                  key={day.date}
                  title={`${getStringFormattedDate(day.date)}: ${pluralActivities(day.count)}`}
                  className={cn('h-4 w-4 rounded-sm', getCellClass(day.count))}
                />
              ) : (
                <span key={`blank-${index}`} className="h-4 w-4" />
              ),
            )}
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          <Fact value={`${getCurrentStreak(days)}d`} label="Current streak" />
          <Fact value={`${getLongestStreak(days)}d`} label="Longest streak" />
          <Fact value={busiest ? getStringFormattedDate(busiest.date) : '—'} label="Busiest day" />
          <Fact value={busiest ? pluralActivities(busiest.count) : 'None yet'} label="On that day" />
        </div>
      </div>
    </div>
  );
};
