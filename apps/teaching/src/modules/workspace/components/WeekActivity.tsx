import { type MeetDto } from '@repo/shared/contracts';
import { cn } from '@repo/ui/lib';
import { addDaysToDate, getEndOfDay, getFullCalendarEvents, getStartOfDay, getStartOfWeek } from '@utils/helpers';
import Link from 'next/link';

interface IProps {
  meets: MeetDto[];
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Sessions per day of the current week, Sunday first. */
const sessionsPerDay = (meets: MeetDto[]): { date: Date; count: number }[] => {
  const weekStart = getStartOfWeek(new Date());
  return DAY_LETTERS.map((_, index) => {
    const date = addDaysToDate(weekStart, index);
    const count = meets.reduce(
      (total, meet) => total + getFullCalendarEvents(meet, getStartOfDay(date), getEndOfDay(date)).length,
      0,
    );
    return { date, count };
  });
};

/**
 * This week as seven bars, one per day, so the shape of the week reads at a glance: where the
 * teaching is, and where the gaps are. Each bar is a link to that day on the calendar.
 */
export const WeekActivity = ({ meets }: IProps) => {
  const days = sessionsPerDay(meets);
  const max = Math.max(1, ...days.map((day) => day.count));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const today = new Date().toDateString();

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-background p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">This week</h3>
        <span className="text-xs text-muted-foreground">
          {total} {total === 1 ? 'session' : 'sessions'}
        </span>
      </div>
      <div
        className="mt-4 flex flex-1 items-end justify-between gap-2"
        role="img"
        aria-label={`${total} sessions this week`}
      >
        {days.map(({ date, count }, index) => {
          const isToday = date.toDateString() === today;
          return (
            <Link
              key={date.toISOString()}
              href="/calender"
              title={`${count} ${count === 1 ? 'session' : 'sessions'}`}
              className="group flex h-28 flex-1 flex-col items-center justify-end gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  'w-full rounded-t-md transition-all group-hover:opacity-80',
                  count ? 'bg-primary' : 'bg-muted',
                  isToday && count && 'ring-2 ring-primary/30 ring-offset-1 ring-offset-background',
                )}
                style={{ height: `${count ? Math.max(12, (count / max) * 80) : 6}px` }}
              />
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xxs font-semibold',
                  isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                {DAY_LETTERS[index]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
