/**
 * Dark theme. Same key set as `light.ts` — a key missing from either file makes that class
 * disappear in one mode, so the two must stay in lockstep.
 *
 * Surfaces are slate rather than pure black: an unlit black leaves borders and elevation nothing to
 * sit against. Ordered most recessed to raised: `muted` (canvas) < `background` (base) <
 * `accent`/`secondary` (hover) < `card`/`popover` (raised). That ordering is inverted from the light
 * theme — recessed means darker here and lighter there — which is exactly what the tokens exist to
 * hide from call sites.
 *
 * `primary` inverts to near-white, so `bg-primary text-primary-foreground` stays a high-contrast
 * button in both modes, and the status colours lighten so they read against a dark ground.
 */
export const dark = {
  colors: {
    background: '#0f172a',
    foreground: '#f8fafc',

    card: '#1a2438',
    'card-foreground': '#f8fafc',

    popover: '#1a2438',
    'popover-foreground': '#f8fafc',

    primary: '#f8fafc',
    'primary-foreground': '#0f172a',

    secondary: '#1e293b',
    'secondary-foreground': '#f8fafc',

    muted: '#020617',
    'muted-foreground': '#94a3b8',

    accent: '#1e293b',
    'accent-foreground': '#f8fafc',

    destructive: '#f87171',
    'destructive-foreground': '#0f172a',

    success: '#4ade80',
    'success-foreground': '#0f172a',

    warning: '#fbbf24',
    'warning-foreground': '#0f172a',

    info: '#4da3ff',
    'info-foreground': '#0f172a',

    border: '#263349',
    input: '#334155',
    ring: '#cbd5e1',

    'chart-1': '#4da3ff',
    'chart-2': '#4ade80',
    'chart-3': '#c084fc',
    'chart-4': '#fbbf24',
    'chart-5': '#f472b6',
  },
};
