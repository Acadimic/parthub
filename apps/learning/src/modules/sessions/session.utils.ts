import { type MeetDto } from '@repo/shared/contracts';
import { MeetStatus } from '@enums';
import dayjs from 'dayjs';

/** Where a session is in its life, from the learner's clock. Drives every label and button. */
export type SessionState = 'live' | 'soon' | 'today' | 'upcoming' | 'ended' | 'cancelled';

/** A session counts as "soon" from this many minutes before it starts. */
const SOON_MINS = 60;

const getStart = (meet: MeetDto) => (meet.startTime ? dayjs(meet.startTime) : null);
const getEnd = (meet: MeetDto) => {
  if (meet.endTime) return dayjs(meet.endTime);
  const start = getStart(meet);
  return start ? start.add(meet.durationMins ?? 60, 'minute') : null;
};

export const getSessionState = (meet: MeetDto, now = dayjs()): SessionState => {
  if (meet.status === MeetStatus.CANCELLED) return 'cancelled';
  if (meet.status === MeetStatus.COMPLETED) return 'ended';
  const start = getStart(meet);
  const end = getEnd(meet);
  if (!start || !end) return 'upcoming';
  if (meet.status === MeetStatus.LIVE || (now.isAfter(start) && now.isBefore(end))) return 'live';
  if (now.isAfter(end)) return 'ended';
  if (start.diff(now, 'minute') <= SOON_MINS) return 'soon';
  if (start.isSame(now, 'day')) return 'today';
  return 'upcoming';
};

export const isSessionOpen = (state: SessionState) => state !== 'ended' && state !== 'cancelled';

/** "Live now", "Starts in 25 min", "Today at 6:00 PM", "Tomorrow at 6:00 PM", "In 5 days", "Ended". */
export const getSessionTiming = (meet: MeetDto, now = dayjs()): string => {
  const state = getSessionState(meet, now);
  const start = getStart(meet);
  if (state === 'cancelled') return 'Cancelled';
  if (state === 'ended') return 'Ended';
  if (state === 'live') return 'Live now';
  if (!start) return 'Time to be announced';
  const mins = start.diff(now, 'minute');
  if (mins < 60) return `Starts in ${Math.max(1, mins)} min`;
  if (start.isSame(now, 'day')) return `Today at ${start.format('h:mm A')}`;
  if (start.isSame(now.add(1, 'day'), 'day')) return `Tomorrow at ${start.format('h:mm A')}`;
  const days = start.startOf('day').diff(now.startOf('day'), 'day');
  if (days < 7) return `${start.format('dddd')} at ${start.format('h:mm A')}`;
  return `In ${days} days`;
};

/** The time span in the learner's own timezone, and how long it runs. */
export const getSessionSpan = (meet: MeetDto) => {
  const start = getStart(meet);
  const end = getEnd(meet);
  if (!start) return '';
  const span = end ? `${start.format('h:mm A')} – ${end.format('h:mm A')}` : start.format('h:mm A');
  const mins = meet.durationMins ?? (end ? end.diff(start, 'minute') : 0);
  return mins ? `${span} · ${mins} min` : span;
};

/** The bullet points a teacher writes into the description, one per line, or the text as it is. */
export const getSessionPoints = (meet: MeetDto): string[] =>
  (meet.description ?? '')
    .split('\n')
    .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);

export interface ISessionGroup {
  key: 'live' | 'today' | 'week' | 'later' | 'past';
  title: string;
  meets: MeetDto[];
}

/** Sessions in the order a learner wants them: what is on now, then today, this week, later, past. */
export const groupSessions = (meets: MeetDto[], now = dayjs()): ISessionGroup[] => {
  const sorted = [...meets].sort((a, b) => dayjs(a.startTime ?? 0).valueOf() - dayjs(b.startTime ?? 0).valueOf());
  const endOfWeek = now.endOf('week');
  const groups: ISessionGroup[] = [
    { key: 'live', title: 'Live now', meets: [] },
    { key: 'today', title: 'Today', meets: [] },
    { key: 'week', title: 'This week', meets: [] },
    { key: 'later', title: 'Later', meets: [] },
    { key: 'past', title: 'Past', meets: [] },
  ];
  sorted.forEach((meet) => {
    const state = getSessionState(meet, now);
    const start = getStart(meet);
    if (state === 'live') groups[0].meets.push(meet);
    else if (state === 'ended' || state === 'cancelled') groups[4].meets.push(meet);
    else if (state === 'soon' || state === 'today') groups[1].meets.push(meet);
    else if (start?.isBefore(endOfWeek)) groups[2].meets.push(meet);
    else groups[3].meets.push(meet);
  });
  // Past runs newest first: the most recent class is the one a learner is most likely to want.
  groups[4].meets.reverse();
  return groups.filter((group) => group.meets.length > 0);
};

/** The session to put in front of the learner: live beats soon beats the next one to start. */
export const getNextSession = (meets: MeetDto[], now = dayjs()): MeetDto | undefined => {
  const open = meets.filter((meet) => isSessionOpen(getSessionState(meet, now)));
  const live = open.find((meet) => getSessionState(meet, now) === 'live');
  if (live) return live;
  return [...open].sort((a, b) => dayjs(a.startTime ?? 0).valueOf() - dayjs(b.startTime ?? 0).valueOf())[0];
};

/** "class" / "classes" — the shared helper only appends an s. */
export const pluralClasses = (count: number) => (count === 1 ? 'class' : 'classes');
