import { dark, light } from '.';

export const getTheme = (mode: 'light' | 'dark') => {
  return mode === 'light' ? light : dark;
};
