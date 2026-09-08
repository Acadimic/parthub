import dayjs from 'dayjs';

export const getFormattedDate = (date: string | Date, format?: string) => {
  format = format || 'MM/DD/YYYY';
  return dayjs(date).format(format);
};

export const getStringFormattedDate = (date: string | Date) => {
  const format = 'MMM DD, YYYY';
  return getFormattedDate(date, format);
};

export const getStringFormattedDateWithTime = (date: string | Date) => {
  const format = 'MM/DD/YYYY HH:mm A';
  return getFormattedDate(date, format);
};

export const getFullFormattedDate = (date: string | Date) => {
  const format = 'dddd, DD MMMM, YYYY';
  return getFormattedDate(date, format);
};

export const getFormattedTime = (date: string | Date) => {
  return dayjs(date).format('hh:mm A');
};

export const getStartOfDay = (date: string | Date) => {
  return dayjs(date).startOf('day').toDate();
};

export const getEndOfDay = (date: string | Date) => {
  return dayjs(date).endOf('day').toDate();
};

export const getStartOfWeek = (date: string | Date) => {
  return dayjs(date).startOf('week').toDate();
};

export const getEndOfWeek = (date: string | Date) => {
  return dayjs(date).endOf('week').toDate();
};

export const getStartOfMonth = (date: string | Date) => {
  return dayjs(date).startOf('month').toDate();
};

export const getEndOfMonth = (date: string | Date) => {
  return dayjs(date).endOf('month').toDate();
};

/** Minutes offset from UTC for the current browser timezone. */
export const getTimezoneOffset = () => {
  return dayjs().utcOffset();
};

export const getTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const addSecondsToDate = (date: Date, seconds: number) => {
  return dayjs(date).add(seconds, 'seconds').toDate();
};

export const addMinutesToDate = (date: Date, minutes: number) => {
  return dayjs(date).add(minutes, 'minutes').toDate();
};

export const subtractMinutesFromDate = (date: Date, minutes: number) => {
  return dayjs(date).subtract(minutes, 'minutes').toDate();
};

export const addDaysToDate = (date: Date, days: number) => {
  return dayjs(date).add(days, 'days').toDate();
};

export const addWeeksToDate = (date: Date, weeks: number) => {
  return dayjs(date).add(weeks, 'weeks').toDate();
};

export const addMonthsToDate = (date: Date, months: number) => {
  return dayjs(date).add(months, 'months').toDate();
};

export const subtractDaysFromDate = (date: Date, days: number) => {
  return dayjs(date).subtract(days, 'days').toDate();
};

export const subtractWeeksFromDate = (date: Date, weeks: number) => {
  return dayjs(date).subtract(weeks, 'weeks').toDate();
};

export const subtractMonthsFromDate = (date: Date, months: number) => {
  return dayjs(date).subtract(months, 'months').toDate();
};

export const datesMinutesDiff = (maxDate: Date, minDate: Date) => {
  return dayjs(maxDate).diff(minDate, 'minutes');
};

export const setTime = (currentDateObj: Date, setTimeDateObj: Date): Date => {
  const currentDate = new Date(currentDateObj);
  currentDate.setHours(setTimeDateObj.getHours(), setTimeDateObj.getMinutes(), 0, 0);
  return new Date(currentDate);
};

/** @deprecated identical to {@link getTimezoneOffset}; kept for the admin app's existing imports. */
export const getUtcOffset = getTimezoneOffset;
