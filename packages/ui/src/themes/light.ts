/**
 * Light theme — shadcn's token vocabulary on a cool neutral ramp, with a single interactive hue.
 *
 * Hex is the stored form because it is what `scripts/contrast.mjs` parses and what a designer
 * reads. `tailwind.ts` converts each value to space-separated HSL channels at config time and
 * emits it as a CSS custom property, which is what makes `bg-primary/15` resolve — see the note
 * there before changing the storage format.
 *
 * A key here is the class suffix: `background` -> `bg-background`, `muted-foreground` ->
 * `text-muted-foreground`. Keys are flat rather than nested so the shadcn `<role>` /
 * `<role>-foreground` pairing survives.
 *
 * Three rules hold the palette together, and `.claude/skills/add-a-theme/scripts/contrast.mjs`
 * enforces all three:
 *
 * 1. Every surface role has a `-foreground` that clears WCAG AA (4.5:1) on it, so
 *    `bg-primary text-primary-foreground` is legible by construction and no call site picks a
 *    text colour.
 * 2. Surfaces stay far enough apart to read as separate planes. Ordered here recessed to raised:
 *    `accent` (hover) < `secondary` < `muted` (canvas) < `background` = `card`/`popover`.
 * 3. Accents are picked so one value works as text on the page *and* as a fill under its own
 *    foreground — contrast is symmetric, so ~5:1 against white covers both jobs.
 *
 * The greys carry a slight blue cast rather than being pure neutral. That is what keeps them
 * reading as the same family as `primary` once the two sit side by side; a pure grey next to a
 * periwinkle action reads as two unrelated palettes.
 *
 * `dark.ts` defines the same keys with the ramp inverted. That inversion is why no component
 * should ever need a `dark:` variant for colour.
 */
export const light = {
  colors: {
    background: '#ffffff',
    foreground: '#1a1c22',

    card: '#ffffff',
    'card-foreground': '#1a1c22',

    popover: '#ffffff',
    'popover-foreground': '#1a1c22',

    // The one interactive hue: buttons, links, active nav, focus rings, selected rows. Darkened
    // from the reference `#5773f0`, which only clears AA on a dark ground — this value is picked
    // to work both as `text-primary` on white (6.5:1) and as a fill under white text.
    primary: '#3b4fd0',
    'primary-foreground': '#ffffff',

    // A solid fill under light text, such as an open module's number. The same as `primary` here;
    // in dark it is a deeper indigo, because `primary` there is pale and carries dark text.
    'primary-fill': '#3b4fd0',
    'primary-fill-foreground': '#ffffff',

    secondary: '#e9ecf4',
    'secondary-foreground': '#1a1c22',

    // Page canvas and any subtle fill.
    muted: '#f4f5f8',
    'muted-foreground': '#5d6473',

    // Hover and active fills — one step stronger than the canvas so a hover still reads on it.
    accent: '#e1e5ef',
    'accent-foreground': '#1a1c22',

    destructive: '#c02f2c',
    'destructive-foreground': '#ffffff',

    success: '#0d7a4d',
    'success-foreground': '#ffffff',

    'success-fill': '#0d7a4d',
    'success-fill-foreground': '#ffffff',

    warning: '#96620d',
    'warning-foreground': '#ffffff',

    // Sky rather than the periwinkle of `primary`. An informational notice sitting next to a
    // primary button has to be distinguishable from it, which a second blue of the same hue is not.
    info: '#0e6da8',
    'info-foreground': '#ffffff',

    // The logo mark and the handful of places that carry product identity — not an action. It is
    // the warm complement to `primary` on purpose: the two never compete, because `brand` never
    // appears on anything clickable.
    brand: '#c4501f',
    'brand-foreground': '#ffffff',

    border: '#e3e5ec',
    input: '#d2d6e0',
    ring: '#3b4fd0',

    // Categorical, not semantic. Five hues chosen for separability rather than meaning, so nothing
    // should read significance into `chart-3` being amber.
    'chart-1': '#3b4fd0',
    'chart-2': '#0f766e',
    'chart-3': '#b45309',
    'chart-4': '#be123c',
    'chart-5': '#7c3aed',

    // What a course item is: read, watch or be tested. Three hues spread around the wheel and away
    // from `primary`, so the kind reads at a glance without looking like the selected row.
    'content-reading': '#0e7490',
    'content-reading-foreground': '#ffffff',
    'content-video': '#a21caf',
    'content-video-foreground': '#ffffff',
    'content-test': '#c2410c',
    'content-test-foreground': '#ffffff',
  },
};
