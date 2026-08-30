import { IFullCalendarEvent } from '@interfaces';
import { IMeet } from '@stores';
import {
  getEndOfDay,
  getEndOfMonth,
  getEndOfWeek,
  getFullCalenderEvents,
  getStartOfDay,
  getStartOfMonth,
  getStartOfWeek,
} from '@utils/helpers';

interface IProps {
  date: Date;
  meets: IMeet[];
}

export const getDayEvents = ({ date, meets }: IProps): IFullCalendarEvent[] => {
  const startDate = getStartOfDay(date);
  const endDate = getEndOfDay(date);
  console.log('getDayEvents:', startDate, endDate, meets);
  const events = meets.map((meet) => getFullCalenderEvents(meet, startDate, endDate));
  return events.flat();
};

export const getWeekEvents = ({ date, meets }: IProps) => {
  const startDate = getStartOfWeek(date);
  const endDate = getEndOfWeek(date);
  const events = meets.map((meet) => getFullCalenderEvents(meet, startDate, endDate));
  return events.flat();
};

export const getMonthEvents = ({ date, meets }: IProps) => {
  const startDate = getStartOfMonth(date);
  const endDate = getEndOfMonth(date);
  const events = meets.map((meet) => getFullCalenderEvents(meet, startDate, endDate));
  return events.flat();
};
