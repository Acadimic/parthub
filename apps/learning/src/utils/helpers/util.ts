import { type StandardDto } from '@repo/shared/contracts';
import { capitalize, clearBrowserStorage, splitCamelCase } from '@repo/ui/lib';
import { type ISelectItem } from '@interfaces';
import { WEEK_DAYS_INTEGER_MAPPINGS } from '@repo/shared/utils';
import { logOut as signOut } from '../firebase';
import { errorToast } from './toasts';

export const logOut = () => {
  clearBrowserStorage();
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

export const getStandardSelectItem = (standard: StandardDto): ISelectItem => {
  return { label: standard.name, value: standard._id, group: standard.group };
};

// Generic rather than `Record<string, unknown>`, which an `interface` is not assignable to: every
// form's state is declared as one, so the parameter type rejected the callers it exists for.
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
