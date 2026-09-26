import { type MeetDto } from '@repo/shared/contracts';
import { Link, Tooltip } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { Avatar } from '@components/app/avatars';
import { CopyUrl } from '@components/common';
import { CalendarPlusIcon, VideoCameraIcon } from '@phosphor-icons/react';
import { useUserLookups } from '@stores';
import { getEventColor } from '@themes';
import dayjs from 'dayjs';
import { getSessionState, getSessionTiming, type SessionState } from '../session.utils';

/** A red dot that breathes, for anything that is on right now. */
export const LivePulse = ({ className }: { className?: string }) => (
  <span className={cn('relative flex h-2.5 w-2.5', className)} aria-hidden="true">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
  </span>
);

const STATE_TONE: Record<SessionState, 'destructive' | 'warning' | 'primary' | 'info' | 'neutral'> = {
  live: 'destructive',
  soon: 'warning',
  today: 'primary',
  upcoming: 'info',
  ended: 'neutral',
  cancelled: 'neutral',
};

/** The one line that says when: live, starts in, today at, a weekday, or ended. */
export const SessionTiming = ({ meet, className }: { meet: MeetDto; className?: string }) => {
  const state = getSessionState(meet);
  return (
    <Badge
      tone={STATE_TONE[state]}
      appearance={state === 'live' || state === 'soon' ? 'solid' : 'outline'}
      className={cn('gap-1.5', className)}
    >
      {state === 'live' ? <LivePulse className="h-2 w-2 [&>span]:h-2 [&>span]:w-2" /> : null}
      {getSessionTiming(meet)}
    </Badge>
  );
};

/** The calendar leaf: month over day, in the session's own colour. */
export const DateLeaf = ({ meet, size = 'md' }: { meet: MeetDto; size?: 'md' | 'lg' }) => {
  const start = meet.startTime ? dayjs(meet.startTime) : null;
  const mode =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const accent = getEventColor(mode, meet.color);
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-background text-center',
        size === 'lg' ? 'h-16 w-16' : 'h-12 w-12',
      )}
    >
      <div
        className={cn(
          'w-full text-xxs font-semibold uppercase tracking-caps text-primary-foreground',
          size === 'lg' ? 'py-1' : 'py-0.5',
        )}
        style={accent ? { backgroundColor: accent } : undefined}
      >
        {start ? start.format('MMM') : '—'}
      </div>
      <div
        className={cn(
          'flex flex-1 items-center font-mono font-semibold leading-none',
          size === 'lg' ? 'text-2xl' : 'text-lg',
        )}
      >
        {start ? start.format('D') : '?'}
      </div>
    </div>
  );
};

/** Who is teaching, when the user is loaded; nothing otherwise, rather than a blank row. */
export const SessionHost = ({ meet, className }: { meet: MeetDto; className?: string }) => {
  const { getUserById } = useUserLookups();
  const host = meet.createdBy ? getUserById(meet.createdBy) : undefined;
  if (!host) return null;
  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
      <Avatar id={host._id} name={host.name || 'Teacher'} avatar={host.photoUrl} size={20} />
      <span className="truncate">with {host.name}</span>
    </div>
  );
};

/**
 * The way in. A live or imminent session gets the filled button; a later one a quieter "Join" that
 * still opens the room, since teachers often open it early. Without a link yet, it says so.
 */
export const JoinAction = ({ meet, size = 'md' }: { meet: MeetDto; size?: 'md' | 'lg' }) => {
  const state = getSessionState(meet);
  const padding = size === 'lg' ? 'px-5 py-2.5' : 'px-3.5 py-2';
  if (state === 'cancelled') return <span className="text-sm text-muted-foreground">This session was cancelled.</span>;
  if (state === 'ended') return <span className="text-sm text-muted-foreground">This session has ended.</span>;
  if (!meet.meetingLink) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarPlusIcon weight="bold" className="h-4 w-4" />
        Joining link is shared before the class
      </span>
    );
  }
  const isHot = state === 'live' || state === 'soon';
  return (
    <div className="flex items-center gap-2">
      <Link
        href={meet.meetingLink}
        target="_blank"
        isSecondary={!isHot}
        className={cn(padding, !isHot && 'text-foreground')}
        leftsection={<VideoCameraIcon weight={isHot ? 'fill' : 'bold'} className="h-4 w-4" />}
      >
        {state === 'live' ? 'Join now' : 'Join'}
      </Link>
      <Tooltip title="Copy joining link">
        <span>
          <CopyUrl url={meet.meetingLink} isCopyIconOnly />
        </span>
      </Tooltip>
    </div>
  );
};
