/**
 * Bridges `light.ts` / `dark.ts` to Tailwind, replacing the `tw-colors` plugin.
 *
 * Two exports, and both have to be used together: `themeVariables` emits the custom properties,
 * `themeColors` emits the utilities that read them. Registering one without the other yields
 * either variables nothing consumes or classes that resolve to an undefined variable — the second
 * fails silently, which is the whole reason they live in one file.
 *
 * Why not `tw-colors` any more: its stable line stops at 3.3.2 while Tailwind ships 4.x, so it is
 * the single blocker on that upgrade (`upgrade-a-dependency` flags it first). Emitting the
 * variables directly is also the shadcn-canonical form, which is what lets `npx shadcn add` drop a
 * component in without its classes resolving to nothing.
 *
 * Channels are stored bare — `232 61% 52%`, no `hsl()` wrapper — and wrapped at the usage site.
 * That is what keeps `<alpha-value>` working, so `bg-primary/15` and `border-success/30` resolve.
 * Wrapping the variable at definition time is the common mistake and it silently kills every
 * opacity modifier in the repo.
 *
 * Tailwind reads this once at config load, so **restart the dev server** after a theme edit.
 */
import { dark } from './dark';
import { light } from './light';

type Tokens = Record<string, string>;

/**
 * `#3b4fd0` -> `232 61% 52%`. Space-separated channels with no wrapper, which is the form
 * `hsl(var(--x) / <alpha-value>)` expects.
 */
const toHslChannels = (hex: string): string => {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
};

const toVars = (tokens: Tokens): Record<string, string> => {
  const vars: Record<string, string> = {};
  Object.keys(tokens).forEach((key) => {
    vars[`--${key}`] = toHslChannels(tokens[key]);
  });
  return vars;
};

/**
 * A key present in one theme and missing from the other makes that utility resolve to an undefined
 * variable in exactly one mode — invisible until somebody toggles the theme. Checking at config
 * load turns that into a build failure instead.
 */
const assertKeyParity = (a: Tokens, b: Tokens) => {
  const onlyInLight = Object.keys(a).filter((k) => !(k in b));
  const onlyInDark = Object.keys(b).filter((k) => !(k in a));
  if (onlyInLight.length || onlyInDark.length) {
    throw new Error(
      `theme token mismatch — light and dark must declare the same keys.${
        onlyInLight.length ? ` Missing from dark: ${onlyInLight.join(', ')}.` : ''
      }${onlyInDark.length ? ` Missing from light: ${onlyInDark.join(', ')}.` : ''}`,
    );
  }
};

assertKeyParity(light.colors, dark.colors);

/**
 * The custom properties for each theme, as plain objects rather than a plugin.
 *
 * They are exported unwrapped because every `:root` block in the final stylesheet has to be
 * emitted by a *single* `addBase` call. Two plugins that each add `:root` do not merge — the later
 * one replaces the earlier, silently. That cost the bare `:root` fallback its entire palette once
 * already, which matters because `<body>` is painted outside the `data-theme` wrapper that
 * `_app.tsx` renders, and so reads its colours from `:root` alone.
 */
export const lightVars = toVars(light.colors);
export const darkVars = toVars(dark.colors);

/** Register under `theme.extend.colors`. Derived from the token list, so a new token needs no edit here. */
export const themeColors: Record<string, string> = Object.keys(light.colors).reduce<Record<string, string>>(
  (acc, key) => {
    acc[key] = `hsl(var(--${key}) / <alpha-value>)`;
    return acc;
  },
  {},
);
