import { type MeetDto } from '@repo/shared/contracts';
import { CopyUrl } from '@components/common';
import { CalendarBlankIcon, VideoCameraIcon } from '@phosphor-icons/react';
import { JoiningLink } from '@modules/calender/components';
import { useMeetLookups } from '@stores';
import { getEventColor } from '@themes';
import { addDaysToDate, getFormattedDate, getFormattedTime, getFullCalendarEvents } from '@utils/helpers';
import Link from 'next/link';
import { type IFullCalendarEvent } from '@interfaces';

/** How far ahead the list looks, and how many rows it shows before "View all" is the better route. */
const DAYS_AHEAD = 7;
const ROW_LIMIT = 6;

interface IUpcoming {
  event: IFullCalendarEvent;
  meet: MeetDto;
}

/** Every sitting in the next week, soonest first. */
const upcomingSessions = (meets: MeetDto[]): IUpcoming[] => {
  const now = new Date();
  const to = addDaysToDate(now, DAYS_AHEAD);
  return meets
    .flatMap((meet) => getFullCalendarEvents(meet, now, to).map((event) => ({ event, meet })))
    .filter(({ event }) => new Date(event.end) >= now)
    .sort((a, b) => new Date(a.event.start).getTime() - new Date(b.event.start).getTime())
    .slice(0, ROW_LIMIT);
};

const dayLabel = (date: Date): string => {
  const today = new Date();
  const tomorrow = addDaysToDate(today, 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return getFormattedDate(date, 'ddd');
};

/**
 * The next week's sessions as a timeline: a date chip, the time, the title, and the joining link.
 * It used to list today only, which on most days was an empty box under a heading.
 */
export const UpcomingSessions = () => {
  const meetStore = useMeetLookups();
  const sessions = upcomingSessions(meetStore.getMeets());
  const mode =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  if (!sessions.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CalendarBlankIcon className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-foreground">Nothing in the next seven days</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Schedule a live class and its joining link shows up here.
        </p>
        <Link href="/calender?add=true" className="mt-1 text-sm font-medium text-primary hover:underline">
          Schedule a session
        </Link>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {sessions.map(({ event, meet }) => {
        const start = new Date(event.start);
        const isToday = dayLabel(start) === 'Today';
        return (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary/40"
          >
            <span
              className={`flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-md text-center ${
                isToday ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
            >
              <span className="text-xxs font-semibold uppercase tracking-caps">{dayLabel(start)}</span>
              <span className="font-mono text-base font-semibold leading-5">{getFormattedDate(start, 'D')}</span>
            </span>
            <span
              className="h-8 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: getEventColor(mode, meet.color) }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{meet.title}</span>
              <span className="block text-xs text-muted-foreground">
                {getFormattedTime(start)} – {getFormattedTime(new Date(event.end))}
                {meet.durationMins ? ` · ${meet.durationMins} min` : ''}
              </span>
            </span>
            {meet.meetingLink ? (
              <span className="flex shrink-0 items-center gap-1">
                <CopyUrl url={meet.meetingLink} isCopyIconOnly />
                <JoiningLink url={meet.meetingLink} isSmall />
              </span>
            ) : (
              <VideoCameraIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </li>
        );
      })}
    </ol>
  );
};
