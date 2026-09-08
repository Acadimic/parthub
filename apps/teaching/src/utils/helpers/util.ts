import {
  addDaysToDate,
  capitalize,
  clearLocalStorage,
  getEndOfWeek,
  getStartOfDay,
  setTime,
  splitCamelCase,
} from '@repo/ui/lib';
import { IFullCalendarEvent, ISelectItem } from '@interfaces';
import { IBatch, IMeet, IStandard } from '@stores';
import { MeetFrequency } from '../../enums';
import { WEEK_DAYS_INTEGER_MAPPINGS } from '../constants';
import { logOut as signOut } from '../firebase';
import { errorToast } from './toasts';

export const logOut = () => {
  clearLocalStorage();
  signOut();
  window.location.replace('/sign-in');
};

export const getFrequencyText = (weekDayIntegers: number[], startTime: string | Date) => {
  if (!weekDayIntegers || weekDayIntegers.length === 0) {
    return new Date(startTime).toLocaleDateString('en-us', { month: 'short', day: 'numeric' });
  }
  weekDayIntegers = weekDayIntegers.sort();
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

export const getStandardSelectItem = (standard: IStandard): ISelectItem => {
  return { label: standard.name, value: standard._id, group: standard.group };
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

export const getBatchSelectItem = (batch: IBatch): ISelectItem => {
  return { label: batch.name, value: batch._id, group: batch.standard };
};

const getFullCalendarEvent = (meet: IMeet, currentDate: Date): IFullCalendarEvent => {
  const date = currentDate.toISOString().split('T')[0];
  return {
    id: `${meet._id}_${date}`,
    title: meet.title,
    date,
    start: setTime(currentDate, new Date(meet.startTime)),
    end: setTime(currentDate, new Date(meet.endTime)),
    timezone: meet.timezone,
    attendees: meet.attendees,
    meetingLink: meet.meetingLink,
    color: meet.color,
    borderColor: 'border-color-border',
  };
};

export const getFullCalendarEvents = (meet: IMeet, startDate: Date, endDate: Date): IFullCalendarEvent[] => {
  const sessions: IFullCalendarEvent[] = [];
  startDate = new Date(startDate);
  endDate = new Date(endDate);
  let currentDate = startDate;
  if ([MeetFrequency.DAILY, MeetFrequency.WEEKLY].includes(meet.frequency)) {
    while (currentDate <= endDate) {
      if (currentDate >= getStartOfDay(meet.startTime)) {
        const weekNumber = currentDate.getDay();
        if (meet.weekDays.includes(weekNumber)) sessions.push(getFullCalendarEvent(meet, currentDate));
      }
      currentDate = addDaysToDate(currentDate, 1);
    }
  } else if (meet.frequency === MeetFrequency.THIS_WEEK) {
    const meetStartDate = getStartOfDay(meet.startTime);
    const meetEndDate = getEndOfWeek(meet.startTime);
    currentDate = startDate;
    while (currentDate <= endDate) {
      if (
        currentDate >= startDate &&
        currentDate <= endDate &&
        currentDate >= meetStartDate &&
        currentDate <= meetEndDate
      ) {
        const weekNumber = currentDate.getDay();
        if (meet.weekDays.includes(weekNumber)) sessions.push(getFullCalendarEvent(meet, currentDate));
      }
      currentDate = addDaysToDate(currentDate, 1);
    }
  } else if (new Date(meet.startTime) >= startDate && new Date(meet.endTime) <= endDate) {
    sessions.push(getFullCalendarEvent(meet, new Date(meet.startTime)));
  }
  return sessions;
};
