import { type MeetDto } from '@repo/shared/contracts';
import { type IFullCalendarEvent } from '@interfaces';
import {
  getEndOfDay,
  getEndOfMonth,
  getEndOfWeek,
  getFullCalendarEvents,
  getStartOfDay,
  getStartOfMonth,
  getStartOfWeek,
} from '@utils/helpers';

interface IProps {
  date: Date;
  meets: MeetDto[];
}

export const getDayEvents = ({ date, meets }: IProps): IFullCalendarEvent[] => {
  const startDate = getStartOfDay(date);
  const endDate = getEndOfDay(date);
  const events = meets.map((meet) => getFullCalendarEvents(meet, startDate, endDate));
  return events.flat();
};

export const getWeekEvents = ({ date, meets }: IProps) => {
  const startDate = getStartOfWeek(date);
  const endDate = getEndOfWeek(date);
  const events = meets.map((meet) => getFullCalendarEvents(meet, startDate, endDate));
  return events.flat();
};

export const getMonthEvents = ({ date, meets }: IProps) => {
  const startDate = getStartOfMonth(date);
  const endDate = getEndOfMonth(date);
  const events = meets.map((meet) => getFullCalendarEvents(meet, startDate, endDate));
  return events.flat();
};
