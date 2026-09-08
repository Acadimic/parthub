import { capitalize, clearLocalStorage, splitCamelCase } from '@repo/ui/lib';
import { ISelectItem } from '@interfaces';
import { IStandard } from '@stores';
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

export const validateFieldValues = (obj: Record<string, unknown>, fields: string[]): string[] => {
  const errorFields: string[] = [];
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      errorFields.push(field);
    } else if (Array.isArray(obj[field]) && obj[field].length === 0) {
      errorFields.push(field);
    }
  }
  if (errorFields.length) errorToast({ message: `${capitalize(splitCamelCase(errorFields[0]))} is required!` });
  return errorFields;
};
