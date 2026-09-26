import { Link } from '@repo/ui/app';
import { Badge, Chip } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { BlankState } from '@components/others';
import { type ActivityKind, type IActivityEvent } from '@interfaces';
import { CheckCircleIcon, ClipboardTextIcon } from '@phosphor-icons/react';
import { getFormattedTime, getMinutesString, getStringFormattedDate } from '@utils/helpers';
import dayjs from 'dayjs';
import { useState } from 'react';

type Filter = ActivityKind | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'lesson', label: 'Lessons' },
  { value: 'test', label: 'Tests' },
];

/** "Today", "Yesterday", then the date. */
const getDayLabel = (date: string) => {
  const day = dayjs(date);
  if (day.isSame(dayjs(), 'day')) return 'Today';
  if (day.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday';
  return getStringFormattedDate(date);
};

const getScoreTone = (percent: number) => {
  if (percent >= 75) return 'success';
  if (percent >= 40) return 'warning';
  return 'destructive';
};

const EventRow = ({ event }: { event: IActivityEvent }) => (
  <li className="relative flex gap-4 pb-6 last:pb-0">
    <span
      className={cn(
        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background',
        event.kind === 'test' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success',
      )}
    >
      {event.kind === 'test' ? (
        <ClipboardTextIcon weight="bold" className="h-4 w-4" />
      ) : (
        <CheckCircleIcon weight="bold" className="h-4 w-4" />
      )}
    </span>
    <div className="min-w-0 flex-1 rounded-lg border border-border bg-background px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">
            {event.kind === 'test' ? 'Attempted a test' : `Completed a ${event.contentType}`} ·{' '}
            {getFormattedTime(event.at)}
          </div>
          <Link
            href={`/courses/${event.courseId}/modules`}
            isSubtle
            className="px-0 py-0 text-sm font-semibold text-foreground hover:bg-transparent hover:text-primary"
          >
            {event.title}
          </Link>
          <div className="truncate text-xs text-muted-foreground">{event.courseName}</div>
        </div>
        {event.kind === 'test' ? (
          <div className="flex items-center gap-2">
            <Badge tone={getScoreTone(event.percent)} appearance="solid">
              {event.marksObtained}/{event.maxMarks}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {event.accuracy}% accuracy · {getMinutesString(event.timeSpentSecs)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  </li>
);

/** Every event, newest first, grouped by day, with a line running down the left. */
export const ActivityTimeline = ({ events }: { events: IActivityEvent[] }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const visible = filter === 'all' ? events : events.filter((event) => event.kind === filter);
  const groups = visible.reduce<{ day: string; events: IActivityEvent[] }[]>((list, event) => {
    const day = dayjs(event.at).format('YYYY-MM-DD');
    const last = list[list.length - 1];
    if (last?.day === day) last.events.push(event);
    else list.push({ day, events: [event] });
    return list;
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            isSelected={filter === option.value}
            onClick={() => setFilter(option.value)}
          />
        ))}
      </div>
      {groups.length === 0 ? (
        <BlankState label="Nothing here yet" description="Activity of this kind will show up as you learn." />
      ) : (
        groups.map((group) => (
          <section key={group.day}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-caps text-muted-foreground">
              {getDayLabel(group.day)}
            </h3>
            <ol className="relative ml-4 border-l border-border pl-0 [&>li]:-ml-4">
              {group.events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ol>
          </section>
        ))
      )}
    </div>
  );
};
