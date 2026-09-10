/**
 * Light theme — shadcn's token vocabulary, on a slate neutral ramp.
 *
 * `getColors` flattens this into tw-colors tokens, so a key here is the class suffix:
 * `background` -> `bg-background`, `muted-foreground` -> `text-muted-foreground`. Keys are written
 * flat (not nested) precisely so the shadcn `<role>` / `<role>-foreground` pairing survives the
 * flattening — nesting would produce `primary-DEFAULT` instead of `primary`.
 *
 * The pairing is the whole system: every surface role has a matching `-foreground` guaranteed to be
 * legible on it, so `bg-primary text-primary-foreground` is readable by construction and no call
 * site has to pick a text colour. `dark.ts` defines the same keys with inverted values, which is
 * why colour never needs a `dark:` variant.
 *
 * Surfaces, lightest to most recessed: `card`/`popover` (raised) = `background` (base) >
 * `accent` (hover) > `muted` (canvas, subtle fill). Every foreground token clears WCAG AA (4.5:1)
 * against every surface it is paired with; the status colours clear it in both directions, so they
 * work as text on the page and as a fill under their own `-foreground`.
 */
export const light = {
  colors: {
    background: '#ffffff',
    foreground: '#0f172a',

    card: '#ffffff',
    'card-foreground': '#0f172a',

    popover: '#ffffff',
    'popover-foreground': '#0f172a',

    // The default action. Near-black rather than a brand hue: colour is reserved for status,
    // so a coloured control in this UI always means something.
    primary: '#0f172a',
    'primary-foreground': '#f8fafc',

    secondary: '#f1f5f9',
    'secondary-foreground': '#0f172a',

    // Page canvas and any subtle fill.
    muted: '#f1f5f9',
    'muted-foreground': '#5b6a80',

    // Hover and active fills. One step stronger than `muted` so a hover reads on the canvas too.
    accent: '#e9eef5',
    'accent-foreground': '#0f172a',

    destructive: '#c81e1e',
    'destructive-foreground': '#ffffff',

    success: '#0a7d4b',
    'success-foreground': '#ffffff',

    warning: '#9a5d06',
    'warning-foreground': '#ffffff',

    info: '#0271ad',
    'info-foreground': '#ffffff',

    border: '#e2e8f0',
    input: '#cbd5e1',
    ring: '#0f172a',

    'chart-1': '#0271ad',
    'chart-2': '#0a7d4b',
    'chart-3': '#7e22ce',
    'chart-4': '#9a5d06',
    'chart-5': '#be185d',
  },
};
