/* eslint-disable @typescript-eslint/no-explicit-any */
import { IPosition } from '@interfaces';
import ObjectID from 'bson-objectid';
import { StorageKey } from '../../enums';
import { WEEK_DAYS_INTEGER_MAPPINGS, WEEK_DAYS_MAPPINGS } from '../constants';
import { logOut as signOut } from '../firebase';

export const IS_WINDOW_UNDEFINED = typeof window === 'undefined';

export const getToken = () => {
  const token = IS_WINDOW_UNDEFINED ? '' : localStorage.getItem(StorageKey.TOKEN);
  return token;
};

export const setToken = (token: string) => {
  if (!IS_WINDOW_UNDEFINED) localStorage.setItem(StorageKey.TOKEN, token);
};

export const clearLocalStorage = () => {
  if (!IS_WINDOW_UNDEFINED) localStorage.clear();
};

export const logOut = () => {
  clearLocalStorage();
  signOut();
  window.location.replace('/signin');
};

export const getColors = (colors: any) => {
  const resColors: any = {};
  Object.keys(colors).forEach((key) => {
    if (typeof colors[key] === 'object') {
      Object.keys(colors[key]).forEach((itemKey) => {
        resColors[`${key}-${itemKey}`] = colors[key][itemKey];
      });
    } else resColors[key] = colors[key];
  });
  return resColors;
};

export const insertAt = (str = '', sub = '', pos: number) => `${str.slice(0, pos)}${sub}${str.slice(pos)}`;

export const getPosition = (str = '', pos: number) => {
  let realPos = 0;
  let imgPos = 0;
  let isFound = false;
  let count = 0;
  let char = '';
  for (let i = 0; i < str.length; i += 1) {
    if (!isFound && str[i] === '&') {
      imgPos += 1;
      isFound = true;
      count += 1;
      char = '&';
    }
    if (imgPos >= pos && !isFound) break;
    if (isFound && str[i] === '<') {
      imgPos += count;
      if (imgPos >= pos) {
        realPos += imgPos - pos;
        break;
      }
    }
    realPos += 1;
    if (str[i] === '<') {
      isFound = true;
      count += 1;
    }
    if (!isFound) {
      imgPos += 1;
    }
    if (isFound && (str[i] === '>' || (char === '&' && str[i] === ';'))) {
      count = 0;
      isFound = false;
      char = '';
    }
  }
  return realPos;
};

export const getCombineValue = (preValue: string, value: string, position: IPosition) => {
  let close = false;
  if (preValue && preValue.endsWith('<br></div>')) {
    const lastIndex = preValue.lastIndexOf('<br></div>');
    preValue.slice(0, lastIndex);
    preValue = preValue.slice(0, lastIndex);
    close = true;
  } else if (preValue && preValue.endsWith('</div>')) {
    const lastIndex = preValue.lastIndexOf('</div>');
    preValue.slice(0, lastIndex);
    preValue = preValue.slice(0, lastIndex);
    close = true;
  }
  const pos = getPosition(preValue, position && position.start);
  const data = insertAt(preValue, value, pos);
  return `${data}${close ? '</div>' : ''}`;
};

export const checkAndGetNumber = (num: string) => {
  if (!num) return num;
  let newNumber = String(num);
  if (newNumber.startsWith('0')) newNumber = newNumber.slice(1);
  if (newNumber.length > 10 && !newNumber.startsWith('+')) return `+${newNumber}`;
  if (newNumber.length === 10) return `+91${newNumber}`;
  return newNumber;
};

export function validateEmail(email: string) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function capitalize(word: string) {
  return word[0].toUpperCase() + word.substring(1).toLowerCase();
}

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

export const groupBy = (objects: any[], getKey: (o: any) => any) => {
  const response: any = {};
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
  return redirectUri || '/home';
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

export const getPlural = (value: number, label: string) => {
  if (value > 1) return `${label}s`;
  return label;
};
