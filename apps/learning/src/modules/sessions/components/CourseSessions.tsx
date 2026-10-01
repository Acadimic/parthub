import { type MeetDto } from '@repo/shared/contracts';
import { Button } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import {
  ArrowsInLineVerticalIcon,
  ArrowsOutLineVerticalIcon,
  CaretDownIcon,
  VideoCameraIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import {
  getNextSession,
  getSessionSpan,
  getSessionState,
  getSessionTiming,
  groupSessions,
  isSessionOpen,
  pluralClasses,
} from '../session.utils';
import { DateLeaf, JoinAction, LivePulse, SessionTiming } from './SessionBits';

/** One class in the course's list: date, title, span, timing and the way in. */
const SessionRow = ({ meet, isNext }: { meet: MeetDto; isNext: boolean }) => {
  const state = getSessionState(meet);
  const isOpen = isSessionOpen(state);
  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5',
        isNext && 'bg-primary/5 ring-1 ring-primary/20',
        !isOpen && 'opacity-60',
      )}
    >
      <DateLeaf meet={meet} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{meet.title}</span>
          {isNext ? <SessionTiming meet={meet} /> : null}
        </div>
        <div className="text-xs text-muted-foreground">{getSessionSpan(meet)}</div>
      </div>
      {/* Only the pinned row spells out the missing link; the rest just say when they are. */}
      <div className="hidden shrink-0 sm:block">
        {isOpen && (isNext || meet.meetingLink) ? (
          <JoinAction meet={meet} />
        ) : (
          <span className="text-xs text-muted-foreground">{getSessionTiming(meet)}</span>
        )}
      </div>
    </li>
  );
};

/**
 * The live classes of the course a learner is in, under the lesson: the next one pinned at the
 * top with its own join button, the rest of the upcoming ones listed, and past ones behind a
 * toggle so the list stays about what is still to come.
 */
export const CourseSessions = ({ meets }: { meets: MeetDto[] }) => {
  const [showPast, setShowPast] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  if (!meets.length) return null;
  const next = getNextSession(meets);
  const groups = groupSessions(meets);
  const upcoming = groups.filter((group) => group.key !== 'past').flatMap((group) => group.meets);
  const past = groups.find((group) => group.key === 'past')?.meets ?? [];
  const isLive = next ? getSessionState(next) === 'live' : false;
  const ToggleIcon = isExpanded ? ArrowsInLineVerticalIcon : ArrowsOutLineVerticalIcon;

  return (
    <section className="rounded-xl border border-border bg-background shadow-sm">
      <header className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <VideoCameraIcon weight="bold" className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Live classes</h2>
            <div className="text-xs text-muted-foreground">
              {upcoming.length} upcoming · {past.length} past
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {isLive ? (
            <span className="flex items-center gap-2 text-sm font-medium text-destructive">
              <LivePulse />
              Live now
            </span>
          ) : null}
          <Button
            isSubtle
            aria-expanded={isExpanded}
            className="px-2.5 py-1 text-xs text-primary"
            leftsection={<ToggleIcon className="h-4 w-4" />}
            text={isExpanded ? 'Collapse' : 'Expand'}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>
      </header>
      {/* Animating grid rows from 0fr to 1fr folds the list to its real height, on the accordion's clock;
          inert keeps the folded join links out of the tab order. */}
      <div
        inert={!isExpanded}
        className={cn(
          'grid transition-[grid-template-rows] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border p-2 md:p-3">
            <div className="flex flex-col gap-2">
              {upcoming.length ? (
                <ul className="flex flex-col gap-1">
                  {upcoming.map((meet) => (
                    <SessionRow key={meet._id} meet={meet} isNext={meet._id === next?._id} />
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  All {past.length} {pluralClasses(past.length)} in this course have taken place.
                </p>
              )}
              {past.length ? (
                <div className="border-t border-border pt-2">
                  <Button
                    isSubtle
                    className="w-full justify-between px-3 py-2 text-xs text-muted-foreground"
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
                    <ul className="mt-1 flex flex-col gap-1">
                      {past.map((meet) => (
                        <SessionRow key={meet._id} meet={meet} isNext={false} />
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * A strip above the lesson when a class is on now or within the hour, so a learner reading a
 * lesson does not miss the room opening. Silent the rest of the time.
 */
export const NextSessionBanner = ({ meets }: { meets: MeetDto[] }) => {
  const next = getNextSession(meets);
  if (!next) return null;
  const state = getSessionState(next);
  if (state !== 'live' && state !== 'soon') return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <LivePulse />
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-caps text-destructive">
            {state === 'live' ? 'Live class in progress' : 'Live class starting soon'}
          </div>
          <div className="truncate text-sm font-semibold">{next.title}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SessionTiming meet={next} />
        <JoinAction meet={next} />
      </div>
    </div>
  );
};
