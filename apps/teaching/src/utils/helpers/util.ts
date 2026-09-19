import { type BatchDto, type MeetDto } from '@repo/shared/contracts';
import {
  addDaysToDate,
  capitalize,
  clearLocalStorage,
  getEndOfWeek,
  getStartOfDay,
  setTime,
  splitCamelCase,
} from '@repo/ui/lib';
import { type IFullCalendarEvent, type ISelectItem } from '@interfaces';
import { WEEK_DAYS_INTEGER_MAPPINGS, getMeetFrequencyMeta } from '../constants';
import { logOut as signOut } from '../firebase';
import { errorToast } from './toasts';

export const logOut = () => {
  clearLocalStorage();
  signOut();
  window.location.replace('/sign-in');
};

export const getFrequencyText = (weekDays: number[], startTime: string | Date) => {
  if (!weekDays || weekDays.length === 0) {
    return new Date(startTime).toLocaleDateString('en-us', { month: 'short', day: 'numeric' });
  }
  const weekDayIntegers = [...weekDays].sort();
  let continuous = true;
  let currentDay = weekDayIntegers[0];
  const firstDay = WEEK_DAYS_INTEGER_MAPPINGS[currentDay];
  let dayString = capitalize(firstDay);
  for (let i = 1; i < weekDayIntegers.length; i += 1) {
    const nextDay = weekDayIntegers[i];
    if (continuous && currentDay + 1 !== nextDay) {
      continuous = false;
    }
    dayString += `, ${capitalize(WEEK_DAYS_INTEGER_MAPPINGS[nextDay])}`;
    currentDay = nextDay;
  }
  if (weekDayIntegers.length === 1) return firstDay;
  if (weekDayIntegers.length === 7 && continuous) return 'Daily';
  if (continuous) return `${firstDay} - ${WEEK_DAYS_INTEGER_MAPPINGS[currentDay]}`;
  return dayString;
};

export const validateFieldValues = <T extends object>(obj: T, fields: string[]): string[] => {
  const values = obj as Record<string, unknown>;
  const errorFields: string[] = [];
  for (const field of fields) {
    if (values[field] === undefined || values[field] === null || values[field] === '') {
      errorFields.push(field);
    } else if (Array.isArray(values[field]) && values[field].length === 0) {
      errorFields.push(field);
    }
  }
  if (errorFields.length) errorToast({ message: `${capitalize(splitCamelCase(errorFields[0]))} is required!` });
  return errorFields;
};

export const getBatchSelectItem = (batch: BatchDto): ISelectItem => {
  return { label: batch.name, value: batch._id, group: batch.standard };
};

/** The two ends of one sitting, narrowed once by `getFullCalendarEvents`. */
interface IMeetTimes {
  start: string;
  end: string;
}

const getFullCalendarEvent = (meet: MeetDto, currentDate: Date, times: IMeetTimes): IFullCalendarEvent => {
  const date = currentDate.toISOString().split('T')[0];
  return {
    id: `${meet._id}_${date}`,
    title: meet.title,
    date,
    start: setTime(currentDate, new Date(times.start)),
    end: setTime(currentDate, new Date(times.end)),
    timezone: meet.timezone,
    attendees: meet.attendees ?? [],
    meetingLink: meet.meetingLink,
    color: meet.color,
    borderColor: 'border-border',
  };
};

/**
 * One event per day in `range` that the meet recurs on, bounded by `window`.
 *
 * The recurring and this-week cases differ only in whether there is an upper bound, so they share
 * this walk. The this-week case also re-checked the range bounds inside the loop, which the loop
 * condition already guarantees.
 */
const collectRecurringSessions = (
  meet: MeetDto,
  range: { from: Date; to: Date },
  window: { notBefore: Date; notAfter?: Date },
  times: IMeetTimes,
): IFullCalendarEvent[] => {
  const sessions: IFullCalendarEvent[] = [];
  let currentDate = range.from;
  while (currentDate <= range.to) {
    const isWithinMeet = currentDate >= window.notBefore && (!window.notAfter || currentDate <= window.notAfter);
    if (isWithinMeet && (meet.weekDays ?? []).includes(currentDate.getDay())) {
      sessions.push(getFullCalendarEvent(meet, currentDate, times));
    }
    currentDate = addDaysToDate(currentDate, 1);
  }
  return sessions;
};

export const getFullCalendarEvents = (meet: MeetDto, from: Date, to: Date): IFullCalendarEvent[] => {
  // `MeetDto` leaves these optional because one class serves both directions and a write body need
  // not send them. A meet with no span cannot be placed on a calendar, so it contributes no events
  // rather than an Invalid Date.
  const { startTime, endTime } = meet;
  if (!startTime || !endTime) return [];

  const times = { start: startTime, end: endTime };
  const range = { from: new Date(from), to: new Date(to) };
  const notBefore = getStartOfDay(startTime);
  const { kind } = getMeetFrequencyMeta(meet.frequency);
  if (kind === 'ongoing') return collectRecurringSessions(meet, range, { notBefore }, times);
  if (kind === 'thisWeek') {
    return collectRecurringSessions(meet, range, { notBefore, notAfter: getEndOfWeek(startTime) }, times);
  }
  if (new Date(startTime) >= range.from && new Date(endTime) <= range.to) {
    return [getFullCalendarEvent(meet, new Date(startTime), times)];
  }
  return [];
};
