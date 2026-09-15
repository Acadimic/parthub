/** @type {import('tailwindcss').Config} */
import { uiPreset } from '../../packages/ui/src/themes/preset';

const tailwindcssAnimate = require('tailwindcss-animate');

/**
 * Everything shared — the palette, radius, type scale, keyframes — lives in `uiPreset` so the three
 * apps cannot drift. Only `content` is app-specific.
 *
 * `important: true` makes every utility emit `!important`, so a plain CSS rule cannot override one
 * but an inline `style={{}}` still beats it. Removing it would silently change which rule wins in
 * every app — see `style-with-tailwind` must #6.
 */
module.exports = {
  presets: [uiPreset],
  darkMode: ['class', '[data-theme="dark"]'],
  important: true,
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx}',
    './src/layouts/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  plugins: [tailwindcssAnimate],
};
