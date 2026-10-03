import { type MeetDto } from '@repo/shared/contracts';
import { getMeetOccurrences, getMeetRepeatText, toRecurringMeet, withNextMeetOccurrence } from '@repo/shared/utils';
import { Button, Link, Tooltip } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { ArrowsClockwiseIcon, CaretDownIcon, ClockIcon, VideoCameraIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { getNextSession, getSessionSpan, getSessionState, groupSessions, pluralClasses } from '../session.utils';
import { BlankState } from '@components/others';
import { MeetFrequency } from '@enums';
import { DateLeaf, JoinAction, SessionTiming } from './SessionBits';

const getRepeats = (meet: MeetDto) => {
  const schedule = toRecurringMeet(meet);
  return schedule ? getMeetRepeatText(schedule) : '';
};

/** How far ahead a recurring class lists its dates. */
const COMING_DAYS = 30;
/** Dates shown before "+N more". */
const VISIBLE_DATES = 4;

/**
 * The sittings of a recurring class after the one its row shows, over the next month, as chips.
 * Cancelled dates are already left out, so a gap in the run is a week off. Nothing for a one-off.
 */
const ComingDates = ({ meet }: { meet: MeetDto }) => {
  const [showAll, setShowAll] = useState(false);
  const schedule = toRecurringMeet(meet);
  if (!schedule || schedule.frequency === MeetFrequency.ONE_TIME) return null;
  const now = new Date();
  const dates = getMeetOccurrences(schedule, now, dayjs(now).add(COMING_DAYS, 'day').toDate())
    .filter((sitting) => sitting.startTime !== meet.startTime)
    .map((sitting) => dayjs(sitting.startTime));
  if (!dates.length) return null;
  const hidden = dates.length - VISIBLE_DATES;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1" aria-label="Coming dates">
      <span className="mr-0.5 text-xxs text-muted-foreground">Then</span>
      {(showAll ? dates : dates.slice(0, VISIBLE_DATES)).map((date) => (
        <Badge key={date.valueOf()} tone="neutral" appearance="soft" className="px-1.5 py-0 text-xxs font-medium">
          {date.format('ddd D MMM')}
        </Badge>
      ))}
      {hidden > 0 ? (
        <Button
          isSubtle
          className="px-1.5 py-0 text-xxs text-primary"
          aria-expanded={showAll}
          onClick={() => setShowAll(!showAll)}
          text={showAll ? 'Show less' : `+${hidden} more`}
        />
      ) : null}
    </div>
  );
};

/** The class to go to next, given the room: when, what, how it repeats, and the join button. */
const FeaturedSession = ({ meet }: { meet: MeetDto }) => {
  const state = getSessionState(meet);
  const isHot = state === 'live' || state === 'soon';
  const repeats = getRepeats(meet);
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-3',
        isHot ? 'border-destructive/40 bg-destructive/5' : 'border-primary/25 bg-primary/5',
      )}
    >
      <div className="flex items-start gap-3">
        <DateLeaf meet={meet} />
        <div className="min-w-0 flex-1">
          <div className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
            {state === 'live' ? 'Happening now' : 'Up next'}
          </div>
          <div className="line-clamp-2 text-sm font-semibold leading-snug">{meet.title}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon weight="bold" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {meet.startTime ? `${dayjs(meet.startTime).format('ddd, D MMM')} · ` : ''}
              {getSessionSpan(meet)}
            </span>
          </div>
          {repeats ? (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowsClockwiseIcon weight="bold" className="h-3.5 w-3.5 shrink-0" />
              {repeats}
            </div>
          ) : null}
          <ComingDates meet={meet} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SessionTiming meet={meet} />
        <JoinAction meet={meet} />
      </div>
    </div>
  );
};

/** A later or past class under the featured one: one row per class, its coming dates inside it. */
const CompactSession = ({ meet }: { meet: MeetDto }) => {
  const isOpen = !['ended', 'cancelled'].includes(getSessionState(meet));
  const repeats = getRepeats(meet);
  const start = meet.startTime ? dayjs(meet.startTime) : null;
  return (
    <li className={cn('flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-accent/40', !isOpen && 'opacity-60')}>
      <div className="w-10 shrink-0 text-center leading-tight">
        <div className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
          {start ? start.format('MMM') : '—'}
        </div>
        <div className="font-mono text-base font-semibold">{start ? start.format('D') : '?'}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{meet.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {[getSessionSpan(meet), repeats].filter(Boolean).join(' · ')}
        </div>
        {isOpen ? <ComingDates meet={meet} /> : null}
      </div>
      {isOpen && meet.meetingLink ? (
        <Tooltip title="Join">
          <span className="shrink-0">
            <Link
              href={meet.meetingLink}
              target="_blank"
              isSubtle
              aria-label={`Join ${meet.title}`}
              className="p-1.5 text-muted-foreground hover:text-primary"
            >
              <VideoCameraIcon weight="bold" className="h-4 w-4" />
            </Link>
          </span>
        </Tooltip>
      ) : null}
    </li>
  );
};

/** The course's sittings, each recurring class moved on to its next one. */
const toSittings = (meets: MeetDto[]) => {
  const now = new Date();
  return meets.map((meet) => withNextMeetOccurrence(meet, now));
};

/** Whether one of the course's classes is on right now, for the tab's live dot. */
export const hasLiveSession = (meets: MeetDto[]) => toSittings(meets).some((meet) => getSessionState(meet) === 'live');

/**
 * The course outline's Live classes tab: the next class featured with its join button, the rest of
 * the upcoming ones as dense rows, and past ones behind a toggle.
 */
export const LiveClassesPanel = ({ meets: storedMeets, isSticky }: { meets: MeetDto[]; isSticky: boolean }) => {
  const [showPast, setShowPast] = useState(false);
  if (!storedMeets.length) {
    return (
      <BlankState
        label="No live classes yet"
        description="Live classes will appear here once your teacher schedules them for the course."
      />
    );
  }
  const meets = toSittings(storedMeets);
  const next = getNextSession(meets);
  const groups = groupSessions(meets.filter((meet) => meet._id !== next?._id));
  const upcoming = groups.filter((group) => group.key !== 'past').flatMap((group) => group.meets);
  const past = groups.find((group) => group.key === 'past')?.meets ?? [];
  const upcomingCount = upcoming.length + (next ? 1 : 0);

  return (
    <>
      <div
        className={cn(
          'flex min-h-[2.5rem] items-center border-b border-border bg-background py-2 pl-4 pr-2',
          isSticky && 'sticky top-0 z-10',
        )}
      >
        <span className="truncate text-xs text-muted-foreground">
          {upcomingCount} upcoming · {past.length} past · times in your timezone
        </span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {next ? (
          <FeaturedSession meet={next} />
        ) : (
          <p className="px-1 py-2 text-sm text-muted-foreground">
            All {past.length} {pluralClasses(past.length)} in this course have taken place.
          </p>
        )}
        {upcoming.length ? (
          <ul className="flex flex-col">
            {upcoming.map((meet) => (
              <CompactSession key={meet._id} meet={meet} />
            ))}
          </ul>
        ) : null}
        {past.length ? (
          <div className="border-t border-border pt-1">
            <Button
              isSubtle
              className="w-full justify-between px-2 py-1.5 text-xs text-muted-foreground"
              onClick={() => setShowPast(!showPast)}
              rightsection={
                <CaretDownIcon
                  weight="bold"
                  className={cn('h-3.5 w-3.5 transition-transform', showPast && 'rotate-180')}
                />
              }
            >
              {showPast ? 'Hide past classes' : `Show ${past.length} past ${pluralClasses(past.length)}`}
            </Button>
            {showPast ? (
              <ul className="flex flex-col">
                {past.map((meet) => (
                  <CompactSession key={meet._id} meet={meet} />
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
};
