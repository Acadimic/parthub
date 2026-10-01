---
description: >
  Own the design system itself: the shadcn token vocabulary these apps use, how a theme is defined
  and reaches Tailwind as CSS variables, how to add a third or fourth theme beyond light and dark,
  and the contrast floor every theme has to clear, with a script that checks it. Use it whenever you
  are changing what the tokens *are*, rather than using them.
when_to_use: >
  Trigger before editing `packages/ui/src/themes/*`, before adding or renaming any design token,
  when asked for a new theme or a brand/high-contrast variant, when a colour needs to differ per
  theme, before touching `preset.ts` or an app's `tailwind.config.js`, when planning the Tailwind 4
  upgrade, and when a `bg-*`/`text-*` pair turns out to be unreadable. Use `style-with-tailwind`
  instead when you are picking a token for a className — that is consuming the system; this is
  changing it.
argument-hint: '[the token or theme you are changing]'
---

# Add a theme

The palette is one source: `packages/ui/src/themes/light.ts` and `dark.ts`, written as hex.

How it reaches Tailwind:

```
light.ts / dark.ts          hex, the editable source
      ↓  tailwind.ts        toHslChannels() -> `232 61% 52%`, exported as lightVars / darkVars
      ↓  preset.ts          one addBase() call emits :root, [data-theme=light], [data-theme=dark]
      ↓                     themeColors maps each token to hsl(var(--x) / <alpha-value>)
      ↓  tailwind.config.js presets: [uiPreset]   — all three apps, nothing app-specific
```

A key is the class suffix: `background` → `bg-background`, `muted-foreground` →
`text-muted-foreground`. Nothing needs a build — `packages/ui` is consumed as source — but Tailwind
reads the config once, so **restart the dev server** after a theme edit or you will be looking at
the old palette and wondering why.

Channels are stored bare and wrapped at the usage site, which is what keeps `<alpha-value>` working
so `bg-primary/90` and `bg-success/15` resolve. Wrapping the variable in `hsl()` at definition time
is the classic mistake and it silently kills every opacity modifier in the repo.

Note that the opacity *scale* is still Tailwind's own — steps of five. `bg-success/12` emits no
class at all, silently. Working tokens do not make an off-scale modifier work.

## must

1. **Keys are written flat, and every key exists in both files.** `primary`,
   `'primary-foreground'` — not `primary: { DEFAULT, foreground }`. A key present in one file and
   missing from the other makes that class resolve to an undefined variable in exactly one mode.
   `assertKeyParity` in `tailwind.ts` throws at config load if the two disagree, so this is
   machine-checked — but keep editing them as a pair anyway.

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
   to read as one sheet. That last check exists because two dark backgrounds were once the same hex
   — a ratio of exactly 1.00 — which erased the boundary between the sidebar, the page and every
   hover state at once. The floor is 1.06:1, which is what bounds how flat the dark ramp can go.

4. **Surfaces are an ordered stack, and the order inverts between themes.**
   Light runs `accent` (hover) < `secondary` < `muted` (canvas) < `background` = `card`/`popover`.
   Dark runs `muted` (canvas) < `background` < `card`/`popover` < `accent` (hover) < `secondary`.

   Note that dark is not a strict mirror: `accent` sits *above* `card` there. Hover has to lift a
   row that is already inside a card, and on a dark ground a hover that darkens reads as the row
   being disabled rather than targeted. Hiding that asymmetry from call sites is the reason tokens
   exist, and it is why no component should ever need a `dark:` variant for colour.

5. **A colour a *user* picked is not a design token.** Tokens name roles — `primary`,
   `destructive`, `muted` — and a role has one meaning. A swatch someone chose for their own meeting
   has no meaning beyond "the one they chose", is keyed by a persisted enum, and belongs in
   `packages/ui/src/themes/event-colors.ts`. Folding the two together is how `blue-primary` ended up
   serving as both the brand action and an event colour, so neither could change independently.

6. **Never a raw hex in a component,** and never a `dark:` variant for colour. If a colour is
   missing, it is a missing token: add it to both themes and use it. Both rules are covered in
   `style-with-tailwind`; they are repeated here because a theme change is exactly when someone is
   tempted to break them "just for this one".

7. **Every `:root` block must come from a single `addBase` call.** Two plugins that each add
   `:root` do not merge — the later silently replaces the earlier. This already cost the bare
   `:root` fallback its entire palette once, which matters because `<body>` is painted outside the
   `data-theme` wrapper `_app.tsx` renders and reads its colours from `:root` alone. Nothing fails
   the build when this happens; only the built CSS shows it.

## Adding a third theme

A brand or high-contrast variant is additive:

1. Copy `dark.ts` to `packages/ui/src/themes/<name>.ts`, keep **every** key, change the values.
2. Export it from `packages/ui/src/themes/index.ts`, and add `<name>Vars` to `tailwind.ts`
   alongside `lightVars` / `darkVars`.
3. Add one line to the single `addBase` call in `preset.ts`:
   `'[data-theme="<name>"]': <name>Vars`. All three apps pick it up through the preset — there is
   nothing per-app to register any more, which used to be the usual mistake.
4. Teach the switcher about it. `_app.tsx` stores `'light' | 'dark'` under `StorageKey.THEME` and
   writes it to `data-theme`; a third value needs the union widened and the toggle turned into a
   select.
5. Run the contrast script on the new file.

## should

- **Pick accents by measuring, not by eye.** Contrast is symmetric, so an accent at ~5:1 against the
  page works *both* as `text-destructive` on the page and as `bg-destructive` under
  `text-destructive-foreground`. One value covers both jobs, which is why the status colours here
  are dark in light mode and bright in dark mode rather than one shared mid-tone. `warning` is the
  one exception: a yellow dark enough to read as text turns brown, so it is a true yellow with dark
  text on it and is never used as text — a soft pill or an icon carries a warning instead.
- **Status colours earn their keep only if they are rare.** The chrome is deliberately neutral so
  that a coloured control always means something. `primary` is the one interactive hue; if a second
  colour starts appearing on clickable things, the signal is gone.
- **Check what a token is actually used for before changing it.**
  `grep -rho "\(bg\|text\|border\)-<token>" apps packages | sort | uniq -c` takes a second and tells
  you whether you are about to darken something that is only ever a background. `text-primary` in
  particular means "interactive" in this codebase, not "emphasis" — emphasis is `text-foreground`.
- **`chart-1..5` is the home for categorical data colours** — series, tags, labels. They are not
  semantic, so nothing should read meaning into `chart-3`, and a *state* (a completed step, an
  active item) must not borrow one.
- Prefer adding a token over adding a one-off. A second `accent` used in one place is a token; a
  hex in a component is a bug you will find twice, once per theme.

## Tailwind 4

The palette no longer blocks it. `tw-colors` did — its stable line stopped at 3.3.2 while Tailwind
shipped 4.x — and it has been removed; the variables are emitted directly, which is also the
shadcn-canonical form and what lets `npx shadcn add` drop a component in without its classes
resolving to nothing. `upgrade-a-dependency` has the remaining hazards for that upgrade.

## After the change

```bash
node .claude/skills/add-a-theme/scripts/contrast.mjs packages/ui/src/themes/light.ts   # and dark.ts
pnpm typecheck:ui
pnpm lint
pnpm build:teaching && pnpm build:learning && pnpm build:support    # the palette is shared
```

Then confirm the CSS actually carries what you intended, rather than trusting the source — the
values are emitted as **HSL channels**, so grepping the built stylesheet for your hex finds nothing
and proves nothing:

```bash
CSS=$(find apps/teaching/.next/static -name '*.css' | head -1)
grep -o ':root{[^}]*}' "$CSS"                  # light palette AND --radius, in one block
grep -o '\[data-theme=dark\]{[^}]*}' "$CSS"
grep -o 'hsl(var(--[a-z-]*) */ *\.[0-9]*)' "$CSS" | sort -u   # alpha modifiers still resolving
```

Count the custom properties in each block and compare. If `:root` has fewer than the themed blocks,
must #7 has been broken and the body has lost its palette.

`verify-changes` has the full ladder and the reasoning behind its order.
