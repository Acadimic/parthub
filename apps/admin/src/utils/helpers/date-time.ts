import dayjs from 'dayjs';

export const getUtcOffset = () => {
  return dayjs().utcOffset();
};

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
