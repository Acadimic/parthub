import { type MeetDto } from '@repo/shared/contracts';
import { Link } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { ArrowRightIcon, ArrowsClockwiseIcon, ClockIcon, GraduationCapIcon } from '@phosphor-icons/react';
import { getMeetRepeatText, toRecurringMeet } from '@repo/shared/utils';
import NextLink from 'next/link';
import { getSessionPoints, getSessionSpan, getSessionState } from '../session.utils';
import { DateLeaf, JoinAction, SessionHost, SessionTiming } from './SessionBits';

interface IProps {
  meet: MeetDto;
  /** The course it belongs to, named and linked on the card so a class is never an orphan. */
  courseId: string;
  courseName: string;
  /** A course the learner has not started: the card sells the course instead of offering a seat. */
  isMine: boolean;
}

/** How many of the teacher's bullet points the card shows before "and N more". */
const MAX_POINTS = 3;

/**
 * One live class. A live or imminent session glows at the edge and offers the room; a later one
 * lists what will be covered; a past one sits back in grey.
 */
export const SessionCard = ({ meet, courseId, courseName, isMine }: IProps) => {
  const courseHref = `/courses/${courseId}/preview`;
  const state = getSessionState(meet);
  const points = getSessionPoints(meet);
  const isOpen = state !== 'ended' && state !== 'cancelled';
  const isHot = state === 'live' || state === 'soon';
  const schedule = toRecurringMeet(meet);
  const repeats = schedule ? getMeetRepeatText(schedule) : '';

  return (
    <article
      className={cn(
        'flex h-full flex-col gap-4 rounded-xl border bg-background p-4 transition-shadow',
        isHot ? 'border-destructive/40 shadow-[0_0_0_4px_hsl(var(--destructive)/0.08)]' : 'border-border',
        !isOpen && 'opacity-70',
      )}
    >
      <div className="flex items-start gap-3">
        <DateLeaf meet={meet} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <SessionTiming meet={meet} />
            <NextLink
              href={courseHref}
              className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              <GraduationCapIcon weight="bold" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{courseName}</span>
            </NextLink>
          </div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{meet.title}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon weight="bold" className="h-3.5 w-3.5" />
            {getSessionSpan(meet)}
          </div>
          {repeats ? (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowsClockwiseIcon weight="bold" className="h-3.5 w-3.5" />
              {repeats}
            </div>
          ) : null}
        </div>
      </div>
      {points.length ? (
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {points.slice(0, MAX_POINTS).map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
              <span className="line-clamp-1">{point}</span>
            </li>
          ))}
          {points.length > MAX_POINTS ? <li className="pl-3 text-xs">and {points.length - MAX_POINTS} more</li> : null}
        </ul>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <SessionHost meet={meet} />
        {isMine ? (
          <JoinAction meet={meet} />
        ) : (
          <div className="flex items-center gap-2">
            <Badge tone="neutral" appearance="outline">
              Part of the course
            </Badge>
            <Link
              href={courseHref}
              isSecondary
              className="px-3 py-1.5 text-foreground"
              rightsection={<ArrowRightIcon weight="bold" className="h-4 w-4" />}
            >
              View course
            </Link>
          </div>
        )}
      </div>
    </article>
  );
};
