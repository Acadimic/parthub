---
description: >
  Own the design system itself: the shadcn token vocabulary these apps use, how a theme is defined
  and wired to Tailwind, how to add a third or fourth theme beyond light and dark, and how to move
  the palette from the `tw-colors` plugin to plain CSS variables — which is what unblocks the
  Tailwind 4 upgrade. Also the contrast floor every theme has to clear, with a script that checks
  it. Use it whenever you are changing what the tokens *are*, rather than using them.
when_to_use: >
  Trigger before editing `packages/ui/src/themes/*`, before adding or renaming any design token,
  when asked for a new theme or a brand/high-contrast variant, when a colour needs to differ per
  theme, before touching `createThemes` or the `colors` block in a `tailwind.config.js`, when
  planning the Tailwind 4 upgrade, and when a `bg-*`/`text-*` pair turns out to be unreadable. Use
  `style-with-tailwind` instead when you are picking a token for a className — that is consuming
  the system; this is changing it.
argument-hint: '[the theme or token you are changing]'
---

# Add a theme

The palette is one source: `packages/ui/src/themes/light.ts` and `dark.ts`. Each app's
`tailwind.config.js` feeds both to the `tw-colors` plugin:

```js
createThemes({ light: getColors(light.colors), dark: getColors(dark.colors) })
```

`getColors` (in `packages/ui/src/lib/util.ts`) flattens the object, so a key is the class suffix:
`background` becomes `bg-background`, `muted-foreground` becomes `text-muted-foreground`. The plugin
emits `[data-theme="light"]` and `[data-theme="dark"]` blocks of CSS variables plus utilities that
read them, and `_app.tsx` sets `data-theme` on a wrapper div. Nothing needs a build — `packages/ui`
is consumed as source — but Tailwind reads the config once, so **restart the dev server** after a
theme edit or you will be looking at the old palette and wondering why.

## must

1. **Keys are written flat, and every key exists in both files.** `primary`, `'primary-foreground'`
   — not `primary: { DEFAULT, foreground }`. Nesting is what `getColors` turns into
   `primary-DEFAULT`, so `bg-primary` would silently generate nothing. And a key present in one
   file and missing from the other makes that class disappear in one mode, which is the kind of bug
   nobody notices until someone switches themes. Check parity as a pair, never one file alone.

2. **Every surface role carries a `-foreground` partner, and the pair must be legible.** That
   pairing is the entire promise of the system: `bg-primary text-primary-foreground` is readable by
   construction, so no call site has to think about which text colour goes on which fill. If you add
   `brand`, you add `brand-foreground` in the same edit.

3. **Run the contrast script before you call a theme done.** It catches the two failures that are
   invisible while you are picking hexes:

   ```bash
   node .claude/skills/add-a-theme/scripts/contrast.mjs packages/ui/src/themes/light.ts
   node .claude/skills/add-a-theme/scripts/contrast.mjs packages/ui/src/themes/dark.ts
   ```

   It exits non-zero on a failure, so it can gate a change. It checks each `<role>`/`-foreground`
   pair, each text token against every surface, and whether two surfaces have drifted close enough
   to read as one sheet. That last check exists because `background.primary` and
   `background.secondary` were once both `#000000` — a ratio of exactly 1.00 — which erased the
   boundary between the sidebar, the page and every hover state at once.

4. **Surfaces are an ordered stack, and the order inverts between themes.** Light runs
   `muted` (canvas) < `accent` (hover) < `background` (base) < `card`/`popover` (raised); dark runs
   `muted` < `background` < `accent` < `card`. Recessed means darker in one theme and lighter in the
   other. Hiding that inversion from call sites is the reason tokens exist, and it is why no
   component should ever need a `dark:` variant for colour.

5. **A colour a *user* picked is not a design token.** Tokens name roles — `primary`,
   `destructive`, `muted` — and a role has one meaning. A swatch someone chose for their own meeting
   has no meaning beyond "the one they chose", is keyed by a persisted enum, and belongs in
   `packages/ui/src/themes/event-colors.ts`. Folding the two together is how `blue-primary` ended up
   serving as both the brand action and an event colour, so neither could change independently.

6. **Never a raw hex in a component,** and never a `dark:` variant for colour. If a colour is
   missing, it is a missing token: add it to both themes and use it. Both rules are covered in
   `style-with-tailwind`; they are repeated here because a theme change is exactly when someone is
   tempted to break them "just for this one".

## Adding a third theme

`tw-colors` takes any number of themes, so a brand or high-contrast variant is additive:

1. Copy `dark.ts` to `packages/ui/src/themes/<name>.ts`, keep **every** key, change the values.
2. Export it from `packages/ui/src/themes/index.ts`.
3. Register it in all three `tailwind.config.js` files:
   `createThemes({ light: ..., dark: ..., <name>: getColors(<name>.colors) })`.
4. Teach the switcher about it. `_app.tsx` currently stores `'light' | 'dark'` under
   `StorageKey.THEME` and writes it to `data-theme`; a third value needs the union widened and the
   toggle turned into a select. The `dark` class it also puts on `<html>` is only there for the
   handful of non-colour `dark:` variants — a new theme does not need one.
5. Run the contrast script on the new file.

Registering in one app and not the others is the usual mistake: the theme then exists in one app and
produces nothing in the other two.

## Moving the palette into CSS

This is the shadcn-canonical form and it is worth doing, for a reason that is about to matter:
**`tw-colors` has no stable Tailwind 4 release.** Its latest stable is 3.3.2 (published 2025-01-29);
only `4.0.0-beta.0` and `4.0.0-beta.1` exist, while Tailwind ships 4.3.3. `upgrade-a-dependency`
lists Tailwind 3 → 4 as the last pending major and flags this plugin as the thing to check first.
Moving the palette to CSS variables removes that blocker, and it is also what lets `npx shadcn add`
drop a component in without its classes resolving to nothing.

Re-verify the version claim before acting on it — `npm view tw-colors versions` — because the whole
argument is "the plugin is stalled", and that can change.

The shape, once you do it:

```css
/* apps/<app>/src/styles/globals.scss */
:root,
[data-theme='light'] {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  /* ...every token, as space-separated HSL channels, no hsl() wrapper */
}
[data-theme='dark'] {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
}
```

```js
// tailwind.config.js — replace the createThemes plugin
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--background) / <alpha-value>)',
      foreground: 'hsl(var(--foreground) / <alpha-value>)',
      // ...
    },
  },
}
```

Channels are stored bare and wrapped at the usage site so `<alpha-value>` keeps working — that is
what makes `bg-primary/90` resolve. Wrapping the variable in `hsl()` at definition time is the
common mistake and it silently kills every opacity modifier.

Three things to keep in mind if you take this on:

- The token *names* do not change, so no `className` in the repo has to change. That is what makes
  this a mechanical, low-risk migration despite touching every app.
- The values must be generated from the existing TypeScript, not retyped. `getColors` plus a small
  script converting hex to HSL channels keeps light and dark in step; hand-transcribing 30 tokens
  twice is how one channel ends up wrong in one theme only.
- Keep `light.ts`/`dark.ts` as the source and generate the CSS, or delete them and make the CSS the
  source — but not both editable. Two editable copies of a palette drift, and the drift shows up as
  a colour that is right in one mode.

## should

- **Pick accents by measuring, not by eye.** Contrast is symmetric, so an accent at ~5:1 against the
  page works *both* as `text-destructive` on the page and as `bg-destructive` under
  `text-destructive-foreground`. One value covers both jobs, which is why the status colours here
  are dark in light mode and bright in dark mode rather than one shared mid-tone.
- **Status colours earn their keep only if they are rare.** `primary` is near-black on purpose:
  when the default action is neutral, a coloured control always means something.
- **Check what a token is actually used for before changing it.**
  `grep -rho "\(bg\|text\|border\)-<token>" apps packages | sort | uniq -c` takes a second and tells
  you whether you are about to darken something that is only ever a background.
- **`chart-1..5` is the home for categorical data colours** — series, tags, labels. They are not
  semantic, so nothing should read meaning into `chart-3`.
- Prefer adding a token over adding a one-off. A second `accent` used in one place is a token; a
  hex in a component is a bug you will find twice, once per theme.

## After the change

```bash
node .claude/skills/add-a-theme/scripts/contrast.mjs packages/ui/src/themes/light.ts   # and dark.ts
pnpm typecheck:ui
pnpm build:teaching && pnpm build:learning && pnpm build:support    # the palette is shared
pnpm lint
```

Then confirm the CSS actually carries what you intended, rather than trusting the source — the
plugin emits **HSL**, so grepping the built stylesheet for your hex finds nothing and proves nothing:

```bash
CSS=$(find apps/teaching/.next/static/chunks -name '*.css' | head -1)
grep -o '\--twc-background:[^;]*' "$CSS"     # per-theme blocks
```

`verify-changes` has the full ladder and the reasoning behind its order.
