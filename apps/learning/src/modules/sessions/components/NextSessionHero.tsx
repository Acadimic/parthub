import { type MeetDto } from '@repo/shared/contracts';
import { cn } from '@repo/ui/lib';
import { Link } from '@repo/ui/app';
import { BookOpenTextIcon, ClockIcon, GraduationCapIcon, UsersThreeIcon } from '@phosphor-icons/react';
import NextLink from 'next/link';
import dayjs from 'dayjs';
import { getSessionPoints, getSessionSpan, getSessionState } from '../session.utils';
import { DateLeaf, JoinAction, LivePulse, SessionHost, SessionTiming } from './SessionBits';

interface IProps {
  meet: MeetDto;
  courseId: string;
  courseName: string;
}

/**
 * The next class, as the first thing on the page: big date, what it covers, and the way in. It
 * glows when the class is on or about to start, so a learner landing here knows to hurry.
 */
export const NextSessionHero = ({ meet, courseId, courseName }: IProps) => {
  const state = getSessionState(meet);
  const isHot = state === 'live' || state === 'soon';
  const points = getSessionPoints(meet);
  const start = meet.startTime ? dayjs(meet.startTime) : null;

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 md:p-7',
        isHot
          ? 'border-destructive/40 bg-gradient-to-br from-destructive/10 via-background to-background'
          : 'border-primary/30 bg-gradient-to-br from-primary/10 via-background to-chart-2/10',
      )}
    >
      <UsersThreeIcon
        weight="fill"
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-48 w-48',
          isHot ? 'text-destructive/10' : 'text-primary/10',
        )}
      />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
        <DateLeaf meet={meet} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">
              {state === 'live' ? 'Happening now' : 'Up next'}
            </span>
            <SessionTiming meet={meet} />
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{meet.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <NextLink
              href={`/courses/${courseId}/preview`}
              className="flex min-w-0 items-center gap-1.5 truncate font-medium text-foreground hover:text-primary hover:underline"
            >
              <GraduationCapIcon weight="bold" className="h-4 w-4 shrink-0" />
              <span className="truncate">{courseName}</span>
            </NextLink>
            {start ? (
              <span className="flex items-center gap-1.5">
                <ClockIcon weight="bold" className="h-4 w-4" />
                {start.format('dddd, D MMM')} · {getSessionSpan(meet)}
              </span>
            ) : null}
          </div>
          {points.length ? (
            <ul className="mt-4 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
              {points.slice(0, 4).map((point) => (
                <li key={point} className="flex gap-2">
                  <span
                    className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', isHot ? 'bg-destructive' : 'bg-primary')}
                  />
                  <span className="line-clamp-2">{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <SessionHost meet={meet} />
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/courses/${courseId}/modules`}
                isSubtle
                className="px-3 py-2 text-foreground"
                leftsection={<BookOpenTextIcon weight="bold" className="h-4 w-4" />}
              >
                Open course
              </Link>
              {state === 'live' ? (
                <span className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <LivePulse />
                  Class is in progress
                </span>
              ) : null}
              <JoinAction meet={meet} size="lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
