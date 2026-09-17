/**
 * The Tailwind preset every app spreads. Before this existed the three `tailwind.config.js` files
 * were byte-identical apart from their `content` globs, so a scale change had to be made three
 * times and silently drifted when it was not.
 *
 * What stays in the app config: `content` (paths are app-relative) and `tailwindcssAnimate` (the
 * apps declare that dependency, `packages/ui` does not — see `extend-a-package` before moving it).
 * Everything else belongs here.
 *
 * Tailwind reads presets once at config load, so **restart the dev server** after editing this.
 */
import { darkVars, lightVars, themeColors } from './tailwind';

/**
 * Recursive because an at-rule key (`@media (...)`) nests a further selector block inside itself,
 * so the values are not uniformly one level deep.
 */
interface ICssStyles {
  [selectorOrAtRule: string]: string | ICssStyles;
}

/** The slice of Tailwind's plugin API this uses. Structural, so no dependency on `tailwindcss`. */
interface IPluginApi {
  addBase: (styles: ICssStyles) => void;
}

/**
 * Every custom property the design system defines, emitted in one `addBase` call.
 *
 * One call is not a style choice: two plugins that each add a `:root` block do not merge, the
 * later silently replaces the earlier, and the bare `:root` fallback is what `<body>` reads —
 * it sits outside the `data-theme` wrapper `_app.tsx` renders. Splitting this up drops the body's
 * palette without failing any build.
 *
 * `--radius` is one knob and every step in `borderRadius` is a multiple of it, so the corner style
 * of the whole interface is this single value. It is `0` because the design is square: buttons,
 * inputs, cards, dialogs and menus all render sharp without a single component saying so.
 *
 * To round the product later, set this alone — `0.5rem` restores the usual 4/6/8/12px ladder with
 * its size hierarchy intact. Nothing else has to change, which is the point of routing it through
 * a token rather than editing `rounded-*` at each call site.
 */
const baseVariables = ({ addBase }: IPluginApi) => {
  addBase({
    // Light on bare `:root` too, so a page paints correctly before the theme attribute is set
    // rather than flashing uncoloured.
    ':root': { ...lightVars, '--radius': '0rem' },
    // Last-resort fallback for the window before `_document.tsx`'s inline script runs, and for a
    // browser with JavaScript disabled. `:not([data-theme])` rather than a plain `:root` is what
    // keeps it from outranking an explicit choice — it stops matching the moment the attribute
    // exists, so it can never override a user who picked light on a dark-mode OS.
    '@media (prefers-color-scheme: dark)': { ':root:not([data-theme])': darkVars },
    '[data-theme="light"]': lightVars,
    '[data-theme="dark"]': darkVars,
  });
};

export const uiPreset = {
  theme: {
    extend: {
      colors: themeColors,

      // Every step is a *multiple* of the knob, not an offset from it. That is what lets the whole
      // interface go square by setting `--radius: 0rem` — with offsets, `sm` would compute to
      // `calc(0px - 4px)`, a negative radius, which is invalid CSS that browsers drop silently,
      // leaving that one step rounded while the rest went sharp.
      //
      // `DEFAULT`, `2xl` and `3xl` are listed even though the design is square: without them bare
      // `rounded` (36 call sites) and `rounded-2xl` fall through to Tailwind's own values and stay
      // curved. `none` and `full` are deliberately untouched — an avatar stays a circle.
      borderRadius: {
        sm: 'calc(var(--radius) * 0.5)',
        DEFAULT: 'calc(var(--radius) * 0.75)',
        md: 'calc(var(--radius) * 0.75)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) * 1.5)',
        '2xl': 'calc(var(--radius) * 2)',
        '3xl': 'calc(var(--radius) * 3)',
      },

      // The apps previously inherited Tailwind's default stack, which resolves to a different face
      // on every OS. Named here so the three apps agree. System-first rather than a webfont: no
      // network round-trip, no layout shift, and nothing to wire into three `_app.tsx` files.
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        // Tabular data — latency figures, counts, ids. Proportional digits make a column of numbers
        // impossible to scan because the decimal points do not line up.
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },

      // Tailwind's own size scale is already well-formed and is left alone deliberately — inventing
      // a parallel set of names alongside it is how a codebase ends up with `text-sm` and
      // `text-body` meaning the same thing. Only the two sizes it lacks are added.
      fontSize: {
        xxs: ['0.625rem', { lineHeight: '0.875rem' }],
      },

      // Uppercase micro-labels (the section headings above a list, the column headers in a table)
      // need positive tracking or the caps crowd; this is the one typographic rule the default
      // scale cannot express as a size.
      letterSpacing: {
        caps: '0.06em',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },

      transitionProperty: {
        width: 'width',
        height: 'height',
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
        // Drives a toast's remaining-time bar. Declared here rather than inline so the duration
        // stays the component's to set and `animation-play-state` can freeze it on hover.
        'toast-countdown': {
          from: { transform: 'scaleX(1)' },
          to: { transform: 'scaleX(0)' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Duration and play-state come through custom properties rather than being set inline.
        // `important: true` makes this shorthand `!important`, which beats a plain inline
        // `animation-duration` — the bar then inherited the shorthand's implicit `0s`, completed
        // instantly and rendered at zero width. A variable is read by the !important rule instead
        // of fighting it.
        'toast-countdown': 'toast-countdown var(--toast-duration, 5000ms) linear forwards var(--toast-play, running)',
      },
    },
  },
  plugins: [baseVariables],
};
