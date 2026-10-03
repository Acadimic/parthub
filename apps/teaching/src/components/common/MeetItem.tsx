import { type MeetDto } from '@repo/shared/contracts';
import { type IRecurringMeet, getMeetRepeatText, getNextMeetOccurrence, toRecurringMeet } from '@repo/shared/utils';
import { Link } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { CopyUrl } from './CopyUrl';
import { ArrowsClockwiseIcon, ClockIcon, LinkBreakIcon, VideoCameraIcon } from '@phosphor-icons/react';
import { getEventColor } from '@themes';
import dayjs, { type Dayjs } from 'dayjs';

interface IProps {
  meet: MeetDto;
}

interface ITiming {
  label: string;
  tone: 'destructive' | 'primary' | 'info' | 'neutral';
}

interface ISitting {
  start: Dayjs;
  end: Dayjs;
}

/** The sitting to show: the next one, or the first once a series is over. */
const getSitting = (schedule: IRecurringMeet): ISitting => {
  const span = getNextMeetOccurrence(schedule, new Date()) ?? schedule;
  return { start: dayjs(span.startTime), end: dayjs(span.endTime) };
};

const getTiming = ({ start, end }: ISitting, now: Dayjs): ITiming => {
  if (now.isAfter(end)) return { label: 'Ended', tone: 'neutral' };
  if (now.isAfter(start)) return { label: 'Live now', tone: 'destructive' };
  if (start.isSame(now, 'day')) return { label: 'Today', tone: 'primary' };
  if (start.isSame(now.add(1, 'day'), 'day')) return { label: 'Tomorrow', tone: 'info' };
  return { label: `In ${start.startOf('day').diff(now.startOf('day'), 'day')} days`, tone: 'info' };
};

/** Month over day, in the session's own colour. */
const DateLeaf = ({ start, color }: { start: Dayjs | null; color: MeetDto['color'] }) => {
  const mode =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const accent = getEventColor(mode, color);
  return (
    <div className="flex h-12 w-12 shrink-0 flex-col overflow-hidden rounded-lg border border-border text-center">
      <div
        className="bg-primary py-0.5 text-xxs font-semibold uppercase tracking-caps text-primary-foreground"
        style={accent ? { backgroundColor: accent } : undefined}
      >
        {start ? start.format('MMM') : '—'}
      </div>
      <div className="flex flex-1 items-center justify-center font-mono text-lg font-semibold leading-none">
        {start ? start.format('D') : '?'}
      </div>
    </div>
  );
};

const JoinActions = ({ url, isLive }: { url: MeetDto['meetingLink']; isLive: boolean }) => {
  if (!url) {
    return (
      <span className="flex shrink-0 items-center justify-end gap-1.5 text-xs text-muted-foreground">
        <LinkBreakIcon weight="bold" className="h-4 w-4" />
        No joining link
      </span>
    );
  }
  return (
    <div className="flex shrink-0 items-center justify-end gap-1">
      <CopyUrl url={url} isCopyIconOnly />
      <Link
        href={url}
        target="_blank"
        isSecondary={!isLive}
        className="px-3 py-1.5"
        leftsection={<VideoCameraIcon weight="bold" className="h-4 w-4" />}
      >
        Join
      </Link>
    </div>
  );
};

/**
 * One session of a course: its next sitting on a calendar leaf, the time span and how it repeats,
 * and the joining link. A recurring session shows the sitting still to come, not the first one.
 */
export const MeetItem = ({ meet }: IProps) => {
  const schedule = toRecurringMeet(meet);
  const sitting = schedule ? getSitting(schedule) : null;
  const timing = sitting ? getTiming(sitting, dayjs()) : null;
  const repeats = schedule ? getMeetRepeatText(schedule) : '';

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/40 sm:flex-row sm:items-center',
        timing?.label === 'Ended' && 'opacity-70',
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <DateLeaf start={sitting?.start ?? null} color={meet.color} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{meet.title}</h3>
            {timing ? (
              <Badge tone={timing.tone} appearance={timing.tone === 'destructive' ? 'solid' : 'soft'}>
                {timing.label}
              </Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {sitting ? (
              <span className="flex items-center gap-1">
                <ClockIcon weight="bold" className="h-3.5 w-3.5" />
                {sitting.start.format('ddd, D MMM h:mm A')} – {sitting.end.format('h:mm A')}
              </span>
            ) : null}
            {repeats ? (
              <span className="flex items-center gap-1">
                <ArrowsClockwiseIcon weight="bold" className="h-3.5 w-3.5" />
                {repeats}
              </span>
            ) : null}
          </div>
          {meet.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{meet.description}</p>
          ) : null}
        </div>
      </div>
      <JoinActions url={meet.meetingLink} isLive={timing?.tone === 'destructive'} />
    </article>
  );
};
