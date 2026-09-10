/**
 * Dark theme. Same key set as `light.ts` — a key missing from either file makes that class vanish
 * in one mode, so the two move together.
 *
 * The surfaces are a neutral grey ramp that starts just above black. Two reasons: an unlit black leaves
 * borders and elevation nothing to sit against, and even ~5% lightness steps let depth be carried
 * by the surface itself instead of a shadow. Ordered recessed to raised — `muted` (canvas) <
 * `background` (base) < `accent`/`secondary` (hover) < `card`/`popover` (raised) — which is the
 * inverse of the light ramp, and exactly what the tokens exist to hide from call sites.
 *
 * `foreground` is deliberately off-white rather than `#ffffff`: pure white on a dark ground
 * halates, and the difference is very visible over a long session.
 */
export const dark = {
  colors: {
    background: '#171717',
    foreground: '#e5e5e5',

    card: '#333333',
    'card-foreground': '#e5e5e5',

    popover: '#333333',
    'popover-foreground': '#e5e5e5',

    // Inverts to near-white: emphasis is the brightest value on a dark ground, the same way it is
    // the darkest on a light one. Its foreground flips to the canvas colour.
    primary: '#fafafa',
    'primary-foreground': '#0a0a0a',

    secondary: '#262626',
    'secondary-foreground': '#e5e5e5',

    muted: '#0a0a0a',
    'muted-foreground': '#a3a3a3',

    accent: '#262626',
    'accent-foreground': '#e5e5e5',

    destructive: '#f87171',
    'destructive-foreground': '#0a0a0a',

    success: '#4ade80',
    'success-foreground': '#0a0a0a',

    warning: '#fbbf24',
    'warning-foreground': '#0a0a0a',

    info: '#60a5fa',
    'info-foreground': '#0a0a0a',

    border: '#363636',
    input: '#4a4a4a',
    ring: '#fafafa',

    'chart-1': '#60a5fa',
    'chart-2': '#2dd4bf',
    'chart-3': '#fbbf24',
    'chart-4': '#fb7185',
    'chart-5': '#a78bfa',
  },
};
