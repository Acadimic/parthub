/**
 * Light theme — shadcn's token vocabulary on a monochrome neutral ramp — pure grey, no hue cast.
 *
 * `getColors` flattens this, so a key here is the class suffix: `background` -> `bg-background`,
 * `muted-foreground` -> `text-muted-foreground`. Keys are flat rather than nested so the shadcn
 * `<role>` / `<role>-foreground` pairing survives the flattening.
 *
 * Three rules hold the palette together, and each is checkable rather than a matter of taste —
 * `.claude/skills/add-a-theme/scripts/contrast.mjs` enforces all three:
 *
 * 1. Every surface role has a `-foreground` that clears WCAG AA (4.5:1) on it, so
 *    `bg-primary text-primary-foreground` is legible by construction and no call site picks a
 *    text colour.
 * 2. Surfaces stay far enough apart to read as separate planes. Ordered here from recessed to
 *    raised: `muted` (canvas) < `accent` (hover) < `background` (base) = `card`/`popover`.
 * 3. Accents are picked so one value works as text on the page *and* as a fill under its own
 *    foreground — contrast is symmetric, so ~5:1 against white covers both jobs.
 *
 * `dark.ts` defines the same keys with the ramp inverted. That inversion is why no component
 * should ever need a `dark:` variant for colour.
 */
export const light = {
  colors: {
    background: '#ffffff',
    foreground: '#262626',

    card: '#ffffff',
    'card-foreground': '#262626',

    popover: '#ffffff',
    'popover-foreground': '#262626',

    // Monochrome, so it carries no hue to distinguish it from body text. `primary` is therefore a
    // step *stronger* than `foreground` (19.8:1 against white, versus 15.2:1) — emphasis and
    // anything interactive read as darker, which is the only hierarchy left once colour is gone.
    primary: '#0a0a0a',
    'primary-foreground': '#fafafa',

    secondary: '#eaeaea',
    'secondary-foreground': '#262626',

    // Page canvas and any subtle fill.
    muted: '#f5f5f5',
    'muted-foreground': '#626262',

    // Hover and active fills — one step stronger than the canvas so a hover still reads on it.
    accent: '#eaeaea',
    'accent-foreground': '#262626',

    destructive: '#b91c1c',
    'destructive-foreground': '#ffffff',

    // Green. With the chrome monochrome, a coloured element always means something.
    success: '#15803d',
    'success-foreground': '#ffffff',

    warning: '#b45309',
    'warning-foreground': '#ffffff',

    info: '#1d4ed8',
    'info-foreground': '#ffffff',

    border: '#e4e4e4',
    input: '#d4d4d4',
    ring: '#0a0a0a',

    // Categorical, not semantic. These stay coloured deliberately: five greys are not separable in
    // a line chart, and a series colour identifies data rather than decorating the interface.
    // `chart-1` shares blue with `info`; different roles, not a mistake.
    'chart-1': '#1d4ed8',
    'chart-2': '#0f766e',
    'chart-3': '#b45309',
    'chart-4': '#be123c',
    'chart-5': '#7c3aed',
  },
};
