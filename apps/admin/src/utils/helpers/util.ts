/* eslint-disable @typescript-eslint/no-explicit-any */
import { capitalize, clearLocalStorage } from '@repo/ui/lib';

import { WEEK_DAYS_INTEGER_MAPPINGS, WEEK_DAYS_MAPPINGS } from '../constants';
import { logOut as signOut } from '../firebase';

export const logOut = () => {
  clearLocalStorage();
  signOut();
  window.location.replace('/signin');
};

const getDayStr = (day: string): string => {
  return WEEK_DAYS_MAPPINGS[day];
};

export const getFrequencyText = (weekDayIntegers = [], startTime: string | Date) => {
  if (!weekDayIntegers || weekDayIntegers.length === 0) {
    return new Date(startTime).toLocaleDateString('en-us', { month: 'short', day: 'numeric' });
  }
  // eslint-disable-next-line no-param-reassign
  weekDayIntegers = weekDayIntegers.sort();
  let continueos = true;
  let currentDay = weekDayIntegers[0];
  const firstDay = WEEK_DAYS_INTEGER_MAPPINGS[currentDay];
  let dayString = capitalize(firstDay);
  for (let i = 1; i < weekDayIntegers.length; i += 1) {
    const nextDay = weekDayIntegers[i];
    if (continueos && currentDay + 1 !== nextDay) {
      continueos = false;
    }
    dayString += `, ${capitalize(WEEK_DAYS_INTEGER_MAPPINGS[nextDay])}`;
    currentDay = nextDay;
  }
  if (weekDayIntegers.length === 1) return getDayStr(firstDay);
  if (weekDayIntegers.length === 7 && continueos) return 'Everyday';
  if (continueos) return `${getDayStr(firstDay)} - ${getDayStr(WEEK_DAYS_INTEGER_MAPPINGS[currentDay])}`;
  return dayString;
};
