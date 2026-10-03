import type { MeetDto } from '../contracts/entity.contract';
import { MeetFrequency } from '../enums/meet.enum';
import { WEEK_DAYS_INTEGER_MAPPINGS } from './constants';

/** The fields of a meet that decide when it sits, resolved once from a `MeetDto` by `toRecurringMeet`. */
export interface IRecurringMeet {
  startTime: string;
  endTime: string;
  durationMins: number;
  frequency: MeetFrequency;
  /** `Date.getDay()` indexes; empty for a one-off. */
  weekDays: number[];
  cancelledDates: string[];
}

export interface IMeetOccurrence {
  startTime: string;
  endTime: string;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const MINUTE_MS = 60 * 1000;
/** Enough to step past a year of cancelled sittings without looping forever on a bad record. */
const MAX_DAYS_SCANNED = 400;

/**
 * The meet's schedule, or null when it has no span to place. A meet saved without a frequency is a
 * one-off, the only reading that shows it at all; the server stores no default for it.
 */
export const toRecurringMeet = (meet: MeetDto): IRecurringMeet | null => {
  if (!meet.startTime || !meet.endTime) return null;
  return {
    startTime: meet.startTime,
    endTime: meet.endTime,
    // From the span rather than the stored field, so every sitting matches the times the teacher picked.
    durationMins: (new Date(meet.endTime).getTime() - new Date(meet.startTime).getTime()) / MINUTE_MS,
    frequency: meet.frequency ?? MeetFrequency.ONE_TIME,
    weekDays: meet.weekDays ?? [],
    cancelledDates: meet.cancelledDates ?? [],
  };
};

const getStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const getMeetDays = (meet: IRecurringMeet): number[] => {
  if (meet.frequency === MeetFrequency.DAILY) return ALL_DAYS;
  return meet.weekDays.length ? meet.weekDays : [new Date(meet.startTime).getDay()];
};

/**
 * The start of every sitting from the day before `from` (a sitting that runs past midnight is still
 * on), in order: the stored start for a one-off, otherwise each day on the meet's weekdays from its
 * start date that was not cancelled, at the start's time of day.
 */
function* walkSittingStarts(meet: IRecurringMeet, from: Date): Generator<Date> {
  const start = new Date(meet.startTime);
  if (meet.frequency === MeetFrequency.ONE_TIME) {
    yield start;
    return;
  }
  const days = getMeetDays(meet);
  const firstDay = getStartOfDay(start);
  const lastDay = meet.frequency === MeetFrequency.THIS_WEEK ? addDays(firstDay, 6 - start.getDay()) : null;
  const cancelled = new Set(meet.cancelledDates.map((date) => new Date(date).toDateString()));
  const dayBefore = addDays(getStartOfDay(from), -1);
  let day = dayBefore > firstDay ? dayBefore : firstDay;

  for (let scanned = 0; scanned < MAX_DAYS_SCANNED; scanned += 1, day = addDays(day, 1)) {
    if (lastDay && day > lastDay) return;
    if (!days.includes(day.getDay()) || cancelled.has(day.toDateString())) continue;
    const sittingStart = new Date(day);
    sittingStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
    yield sittingStart;
  }
}

const toOccurrence = (meet: IRecurringMeet, sittingStart: Date): IMeetOccurrence => ({
  startTime: sittingStart.toISOString(),
  endTime: new Date(sittingStart.getTime() + meet.durationMins * MINUTE_MS).toISOString(),
});

/** The sitting that is on now or comes next, keeping the meet's duration. Null once the meet is over. */
export const getNextMeetOccurrence = (meet: IRecurringMeet, now: Date): IMeetOccurrence | null => {
  for (const sittingStart of walkSittingStarts(meet, now)) {
    if (sittingStart.getTime() + meet.durationMins * MINUTE_MS > now.getTime()) {
      return toOccurrence(meet, sittingStart);
    }
  }
  return null;
};

/** Every sitting that overlaps `from`–`to`, in order. */
export const getMeetOccurrences = (meet: IRecurringMeet, from: Date, to: Date): IMeetOccurrence[] => {
  const occurrences: IMeetOccurrence[] = [];
  for (const sittingStart of walkSittingStarts(meet, from)) {
    if (sittingStart >= to) break;
    if (sittingStart.getTime() + meet.durationMins * MINUTE_MS > from.getTime()) {
      occurrences.push(toOccurrence(meet, sittingStart));
    }
  }
  return occurrences;
};

/** The meet with its next sitting's span in place of the first one, or as it is once it is over. */
export const withNextMeetOccurrence = (meet: MeetDto, now: Date): MeetDto => {
  const schedule = toRecurringMeet(meet);
  const next = schedule ? getNextMeetOccurrence(schedule, now) : null;
  return next ? { ...meet, ...next } : meet;
};

const shortDay = (day: number) => WEEK_DAYS_INTEGER_MAPPINGS[String(day)].slice(0, 3);

/** "Every day", "Every Mon, Wed", "Mon, Wed this week", or `''` for a one-off. */
export const getMeetRepeatText = (meet: IRecurringMeet): string => {
  if (meet.frequency === MeetFrequency.ONE_TIME) return '';
  const days = [...getMeetDays(meet)].sort((a, b) => a - b);
  if (days.length === 7) return 'Every day';
  const names = days.map(shortDay).join(', ');
  return meet.frequency === MeetFrequency.THIS_WEEK ? `${names} this week` : `Every ${names}`;
};
