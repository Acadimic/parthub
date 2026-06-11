/** @type {import('tailwindcss').Config} */
import { dark, light } from './src/themes';
import { getColors } from './src/utils/helpers';

const { createThemes } = require('tw-colors');

module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  important: true,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx}',
    './src/layouts/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      transitionProperty: {
        width: 'width',
        height: 'height',
      },
      fontSize: {
        xxs: '10px',
      },
    },
  },
  plugins: [createThemes({ light: getColors(light.colors), dark: getColors(dark.colors) })],
};
