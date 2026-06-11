import { StorageKey } from '../../enums';

export const IS_WINDOW_UNDEFINED = typeof window === 'undefined';

export const getToken = () => {
  return IS_WINDOW_UNDEFINED ? '' : localStorage.getItem(StorageKey.TOKEN);
};

export const setToken = (token: string) => {
  if (!IS_WINDOW_UNDEFINED) localStorage.setItem(StorageKey.TOKEN, token);
};

export const clearLocalStorage = () => {
  if (!IS_WINDOW_UNDEFINED) localStorage.clear();
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

export function validateEmail(email: string) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export function capitalize(word: string) {
  return word[0].toUpperCase() + word.substring(1).toLowerCase();
}

export const handleError = (error: any, shouldNotThrowError?: boolean) => {
  console.error('API Error:', error?.response?.data || error?.message);
  if (shouldNotThrowError) return null;
  throw error;
};
