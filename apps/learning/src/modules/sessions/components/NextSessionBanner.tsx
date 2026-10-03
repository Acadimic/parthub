import { type MeetDto } from '@repo/shared/contracts';
import { withNextMeetOccurrence } from '@repo/shared/utils';
import { getNextSession, getSessionState } from '../session.utils';
import { JoinAction, LivePulse, SessionTiming } from './SessionBits';

/**
 * A strip above the lesson when a class is on now or within the hour, so a learner reading a
 * lesson does not miss the room opening. Silent the rest of the time.
 */
export const NextSessionBanner = ({ meets }: { meets: MeetDto[] }) => {
  const next = getNextSession(meets.map((meet) => withNextMeetOccurrence(meet, new Date())));
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
