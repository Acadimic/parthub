import { IColor, IScoreRating, ISelectItem } from '@interfaces';
import { IStandard } from '@stores';
import ObjectID from 'bson-objectid';
import randomColor from 'randomcolor';
import { StorageKey } from '../../enums';
import { DEFAULT_TIME_STRING, WEEK_DAYS_INTEGER_MAPPINGS } from '../constants';
import { logOut as signOut } from '../firebase';
import { addSecondsToDate } from './date-time';
import { errorToast } from './toasts';

export const IS_WINDOW_UNDEFINED = typeof window === 'undefined';

export const getToken = () => {
  const token = IS_WINDOW_UNDEFINED ? '' : localStorage.getItem(StorageKey.TOKEN);
  return token;
};

export const setToken = (token: string) => {
  IS_WINDOW_UNDEFINED ? '' : localStorage.setItem(StorageKey.TOKEN, token);
};

export const clearLocalStorage = () => {
  IS_WINDOW_UNDEFINED ? '' : localStorage.clear();
};

export const logOut = () => {
  clearLocalStorage();
  signOut();
  window.location.replace('/sign-in');
};

export const getColors = (colors: Record<string, string | Record<string, string>>) => {
  const resColors: Record<string, string> = {};
  Object.keys(colors).forEach((key) => {
    const value = colors[key];
    if (typeof value === 'object') {
      Object.keys(value).forEach((itemKey) => {
        resColors[`${key}-${itemKey}`] = value[itemKey];
      });
    } else resColors[key] = value;
  });
  return resColors;
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  let newNumber = String(phoneNumber);
  if (newNumber.startsWith('0') || newNumber.startsWith('+')) newNumber = newNumber.slice(1);
  return newNumber;
};

export function validateEmail(email: string) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export function capitalize(word: string) {
  return word[0].toUpperCase() + word.substring(1).toLowerCase();
}

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

export const getYears = (number = 5) => {
  const years = [];
  const year = new Date().getFullYear();
  for (let i = -1; i < number - 1; i += 1) {
    years.push(year - i);
  }
  return years;
};

export const getDays = (number = 180) => {
  const days = [];
  for (let i = 1; i <= number; i += 1) {
    days.push(i);
  }
  return days;
};

export const splitCamelCase = (str = '') => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
};

export const capitalizeFirstWord = (str = '') => {
  return str && str[0].toUpperCase() + str.slice(1);
};

export const groupBy = <T>(objects: Array<T>, getKey: (o: T) => string) => {
  const response: { [key: string]: Array<T> } = {};
  objects.forEach((obj) => {
    if (response[getKey(obj)]) response[getKey(obj)].push(obj);
    else response[getKey(obj)] = [obj];
  });
  return response;
};

export const isValidEmail = (email: string) =>
  email.toLowerCase().match(
    // eslint-disable-next-line no-useless-escape
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
  );

export const getRedirectUri = (redirectUri?: string) => {
  return (redirectUri && decodeURIComponent(redirectUri)) || '/';
};

export const getObjectId = () => {
  return ObjectID().toHexString();
};

export const removeSpecialCharacters = (str: string) => {
  return str.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ');
};

export const getSlug = (str: string) => {
  str = str && removeSpecialCharacters(str.trim().toLowerCase());
  return str?.split(' ').join('-');
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

export const getRandomColor = (_id: string): IColor => {
  const theme = localStorage.getItem(StorageKey.THEME);
  const luminosity = theme === 'dark' ? 'light' : 'dark';
  const color = randomColor({
    hue: 'random',
    luminosity: luminosity,
    seed: _id,
  });
  const bg = randomColor({
    hue: 'random',
    luminosity: luminosity,
    format: 'rgba',
    seed: _id,
    alpha: 0.3,
  });
  return { color, bg };
};

export const getAlphabet = (index: number) => {
  return (index + 10).toString(36).toUpperCase();
};

export const getTwoDigit = (num: number): string => {
  if (num < 10) return `0${num}`;
  return `${num}`;
};

export const getTimeString = (seconds: number) => {
  if (seconds < 0) return DEFAULT_TIME_STRING;
  const hrs = Math.floor(seconds / (60 * 60));
  let secs = seconds % (60 * 60);
  const mins = Math.floor(secs / 60);
  secs = secs % 60;
  return `${getTwoDigit(hrs)}:${getTwoDigit(mins)}:${getTwoDigit(secs)}`;
};

export const getPlural = (value: number, label: string) => {
  if (value > 1) return `${label}s`;
  return label;
};

export const getMinutesString = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return mins
    ? `${mins} ${getPlural(mins, 'min')} ${secs} ${getPlural(secs, 'sec')}`
    : `${secs} ${getPlural(secs, 'sec')}`;
};

export const getRatingItem = (num = 0): IScoreRating => {
  if (num < 18) return { color: 'text-red-primary', text: 'Poor' };
  if (num >= 18 && num < 35) return { color: 'text-yellow-primary', text: 'Good' };
  if (num >= 35 && num < 60) return { color: 'text-green-primary', text: 'Good' };
  if (num >= 60 && num < 80) return { color: 'text-green-primary', text: 'Very Good' };
  return { color: 'text-green-primary', text: 'Excellent' };
};

export const parseCompactUTCDate = (dateStr: string) => {
  // Expecting format YYYYMMDDTHHmmssZ
  if (!dateStr) return new Date('1970-01-01T00:00:00Z');
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1; // Month is 0-indexed
  const day = parseInt(dateStr.slice(6, 8), 10);
  const hour = parseInt(dateStr.slice(9, 11), 10);
  const minute = parseInt(dateStr.slice(11, 13), 10);
  const second = parseInt(dateStr.slice(13, 15), 10);
  return new Date(Date.UTC(year, month, day, hour, minute, second));
};

export const isPresignedUrlExpired = (signedUrl: string) => {
  if (!signedUrl || !signedUrl.includes('?')) return true;
  const params = new URLSearchParams(signedUrl.split('?')[1]);
  const creationDate = parseCompactUTCDate(params.get('X-Amz-Date') || '');
  const expiresInSecs = Number(params.get('X-Amz-Expires')) - 60 * 5;
  const expiryDate = addSecondsToDate(creationDate, expiresInSecs);
  return expiryDate < new Date();
};
