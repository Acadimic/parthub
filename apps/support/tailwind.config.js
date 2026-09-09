/** @type {import('tailwindcss').Config} */
import { dark, light } from '../../packages/ui/src/themes';
import { getColors } from '../../packages/ui/src/lib';

const { createThemes } = require('tw-colors');
const tailwindcssAnimate = require('tailwindcss-animate');

module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  important: true,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx}',
    './src/layouts/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
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
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate, createThemes({ light: getColors(light.colors), dark: getColors(dark.colors) })],
};
