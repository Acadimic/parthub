import { dark } from './dark';
import { light } from './light';

export const getTheme = (mode: 'light' | 'dark') => {
  return mode === 'light' ? light : dark;
};
