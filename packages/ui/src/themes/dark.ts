/**
 * Dark theme. Same key set as `light.ts` — a key missing from either file makes that class vanish
 * in one mode, so the two move together.
 *
 * The surfaces are a cool near-black ramp. Two reasons: an unlit pure black leaves borders and
 * elevation nothing to sit against, and small lightness steps let depth be carried by the surface
 * itself instead of a shadow. Ordered recessed to raised — `muted` (canvas) < `background` (base)
 * < `card`/`popover` (raised) < `accent` (hover) < `secondary` — which is the inverse of the light
 * ramp, and exactly what the tokens exist to hide from call sites.
 *
 * `accent` sits *above* `card` rather than below it, which is the one place this ramp departs from
 * the light theme's mirror image. Hover has to lift a row that is already inside a card, and a
 * hover that darkens reads as the row being disabled rather than targeted.
 *
 * The steps are deliberately small — `muted` to `background` is 1.3:1 — which is the near-flat
 * look the palette is drawn from. They cannot go smaller: `contrast.mjs` fails any two surfaces
 * under 1.06:1, a floor that exists because two of these were once the same hex and the boundary
 * between sidebar, canvas and hover disappeared all at once.
 *
 * `foreground` is deliberately off-white rather than `#ffffff`: pure white on a dark ground
 * halates, and the difference is very visible over a long session.
 */
export const dark = {
  colors: {
    background: '#101116',
    foreground: '#edeef2',

    card: '#1a1c22',
    'card-foreground': '#edeef2',

    popover: '#1a1c22',
    'popover-foreground': '#edeef2',

    // See light.ts: a deep indigo, lifted above both the canvas and the table it frames.
    panel: '#1c2138',
    'panel-foreground': '#edeef2',

    // Lifted from the light theme's `#3b4fd0`: the same hue has to clear AA against a near-black
    // ground here, and a value tuned for white would read as a dark smudge.
    primary: '#6d86f5',
    'primary-foreground': '#0a0b0f',

    'primary-fill': '#3346b8',
    'primary-fill-foreground': '#e6eaff',

    secondary: '#2b2e37',
    'secondary-foreground': '#edeef2',

    muted: '#070709',
    'muted-foreground': '#afb4c1',

    accent: '#23262e',
    'accent-foreground': '#edeef2',

    destructive: '#f25f57',
    'destructive-foreground': '#0a0b0f',

    success: '#7ee4ac',
    'success-foreground': '#0a0b0f',

    'success-fill': '#1a6b48',
    'success-fill-foreground': '#e3fbef',

    warning: '#e0a94a',
    'warning-foreground': '#0a0b0f',

    info: '#5bc0f0',
    'info-foreground': '#0a0b0f',

    brand: '#f08050',
    'brand-foreground': '#0a0b0f',

    border: '#24262d',
    input: '#3a3d47',
    ring: '#6d86f5',

    'chart-1': '#6d86f5',
    'chart-2': '#2dd4bf',
    'chart-3': '#e0a94a',
    'chart-4': '#fb7185',
    'chart-5': '#b79cf5',

    'content-reading': '#22d3ee',
    'content-reading-foreground': '#0a0b0f',
    'content-video': '#e879f9',
    'content-video-foreground': '#0a0b0f',
    'content-test': '#fb923c',
    'content-test-foreground': '#0a0b0f',
  },
};
