import { IPosition, IScoreRating, StorageKey } from '@repo/shared';
import ObjectID from 'bson-objectid';
import randomColor from 'randomcolor';
import { IColor } from '../types';
import { addSecondsToDate } from './date-time';

export const DEFAULT_TIME_STRING = '00:00:00';

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

export function capitalize(word: string) {
  return word[0].toUpperCase() + word.substring(1).toLowerCase();
}

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
  email
    .toLowerCase()
    .match(
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

export const getRandomColor = (_id: string): IColor => {
  const theme = IS_WINDOW_UNDEFINED ? null : localStorage.getItem(StorageKey.THEME);
  const luminosity = theme === 'dark' ? 'light' : 'dark';
  const color = randomColor({ hue: 'random', luminosity, seed: _id });
  const bg = randomColor({ hue: 'random', luminosity, format: 'rgba', seed: _id, alpha: 0.3 });
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
  const secs = seconds % 60;
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

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const replaceColor = (content: string) => {
  if (!content) return content;
  content = content.replace(/color: #000000;/g, 'color: inherit;');
  content = content.replace(/color: #000;/g, 'color: inherit;');
  content = content.replace(/color: #ffffff;/g, 'color: inherit;');
  content = content.replace(/color: #fff;/g, 'color: inherit;');
  content = content.replace(/color="#ffffff"/g, '');
  content = content.replace(/color="#fff"/g, '');
  content = content.replace(/color="#000000"/g, '');
  content = content.replace(/color="#000"/g, '');
  content = content.replace(
    /color: rgb(?:a)?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*(?:0|1|0?\.\d+))?\s*\);/g,
    'color: inherit;',
  );
  return content;
};

export const isPresignedUrlExpired = (signedUrl: string) => {
  if (!signedUrl || !signedUrl.includes('?')) return true;
  const params = new URLSearchParams(signedUrl.split('?')[1]);
  const creationDate = parseCompactUTCDate(params.get('X-Amz-Date') || '');
  const expiresInSecs = Number(params.get('X-Amz-Expires')) - 60 * 5;
  const expiryDate = addSecondsToDate(creationDate, expiresInSecs);
  return expiryDate < new Date();
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
    preValue = preValue.slice(0, lastIndex);
    close = true;
  } else if (preValue && preValue.endsWith('</div>')) {
    const lastIndex = preValue.lastIndexOf('</div>');
    preValue = preValue.slice(0, lastIndex);
    close = true;
  }
  const pos = getPosition(preValue, position && position.start);
  const data = insertAt(preValue, value, pos);
  return `${data}${close ? '</div>' : ''}`;
};

// The constraint must be `any[]`: `unknown[]` makes no concrete callback assignable to T.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

export const splitTextAndMath = (input: string) => {
  const regex = /(\$\$.*?\$\$)/g;
  return input
    .split(regex)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
};
