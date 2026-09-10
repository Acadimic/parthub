---
description: >
  How to style anything in these apps: which colour tokens exist and where they come from, why
  shadcn's own class names silently do nothing here, why you never write a `dark:` variant for
  colour, and what `important: true` in the Tailwind config means for you. Use it before writing a
  className, editing a theme, or touching a Tailwind config or stylesheet.
when_to_use: >
  Trigger when writing or changing any `className`, when picking a colour, when a class you expect
  to work has no visible effect, before editing `packages/ui/src/themes`, an app's
  `tailwind.config.js` or `globals.scss`, before adding a `dark:` variant or a `style={{}}` block,
  and when adding an icon.
argument-hint: '[what you are styling]'
---

# Style with Tailwind

TailwindCSS 3 in all three apps, with the palette supplied by the `tw-colors` plugin from one
shared source: `packages/ui/src/themes/{light,dark}.ts`. Each app's `tailwind.config.js` calls
`createThemes({ light: getColors(light.colors), dark: getColors(dark.colors) })`, and
`getColors` flattens the nested object, so `background: { primary }` becomes the token
`background-primary` and the class `bg-background-primary`.

## must

1. **Colour comes from a token. Never a hex, never an arbitrary colour value.** `bg-[#009ef7]`
   hard-codes the light theme and goes wrong the moment the user switches. Nineteen such classes
   exist today; do not add the twentieth. If a colour you need is missing, add it to **both**
   `light.ts` and `dark.ts` and use the new token.

2. **Do not use shadcn's own token names — they generate nothing here.** `bg-primary`,
   `text-primary-foreground`, `ring-ring` and `border-input` all assume the CSS variables a stock
   shadcn install writes into its stylesheet. This repo defines none of them; `tw-colors` owns the
   palette instead. Checked against the built stylesheet: `.bg-primary`, `.ring-ring`,
   `.text-primary-foreground` and `.border-input` produce **zero** rules, while
   `.bg-background-primary`, `.text-color-primary` and `.text-red-primary` each produce one. There
   are nineteen of these inert classes left inside `packages/ui/src/ui/` primitives. They are
   harmless, but never copy one into new code, and replace it with a real token when you are
   editing that line anyway.

3. **No `dark:` variants for colour.** Every token already has a per-theme value, so
   `bg-background-primary` is white in light mode and near-black in dark mode by itself. The whole
   codebase has seven `dark:` usages. Writing `bg-white dark:bg-black` recreates by hand what the
   theme does for you, and drifts from it.

4. **Merge classes with `cn`,** from `@repo/ui/lib` inside an app or `../../lib/cn` inside the
   package, and put the caller's `className` **last** so a caller can override:
   `cn('px-3 text-sm', error && 'border-red-primary', className)`.

5. **`globals.scss` is not for component styling.** It holds `@tailwind` directives, resets,
   scrollbar rules and a couple of `@layer utilities` helpers such as `.no-scrollbar`. A component's
   appearance belongs in its classes. `apps/teaching/src/styles/calendar.scss` is the one exception:
   third-party FullCalendar internals that cannot be reached with utilities.

6. **`important: true` is set in every app's config.** Every Tailwind utility therefore emits
   `!important`. Two consequences: a plain CSS rule cannot override a utility, and an inline
   `style={{}}` still beats one. Do not try to win a conflict with a longer selector — change the
   class.

## should

**The tokens, by intent.** Semantic first — these are what most code should use:

| Token                                        | Use for                                  |
| -------------------------------------------- | ---------------------------------------- |
| `color-primary` / `color-secondary`          | body text, muted text                    |
| `color-light` / `color-opposite`             | dividers on tinted ground, inverted text |
| `color-border`                               | every border                             |
| `background-primary` / `-secondary` / `-paper` | surfaces: base, hover or inset, cards  |

Then the accent families, each with a `primary` and sometimes `light` / `dark` / `secondary`:
`blue` (links, focus, the default action), `red` (errors and destructive), `green` (success),
`orange` / `yellow` (warning), `purple` / `violet` / `pink` (charts, tags), `grey`.

Opacity modifiers work on tokens: `bg-blue-primary/90`.

**Icons.** Phosphor (`@phosphor-icons/react`), sized with a class rather than a prop. The house
style is `weight="bold"` with `className="w-4 h-4"` inline, `w-5 h-5` in a header or a standalone
action. Use the `*Icon` export names (`CaretDownIcon`, `PencilIcon`); the unsuffixed aliases are
deprecated and warn.

**Responsive layout.** Mobile-first Tailwind prefixes, as the existing forms do:
`flex flex-col md:flex-row`, `w-full md:w-[50%]`. Reach for `useWindowDimensions()` from
`@repo/ui/hooks` only when JavaScript needs the value — it returns `width`, `height`,
`isSmallScreen` (≤768), `isMediumScreen` (769–1024) and `isLargeScreen` (>1024). Layout that CSS
can express should stay in CSS.

**Arbitrary values are fine for geometry, not for colour.** `min-h-[60vh]`, `w-[50%]`,
`h-[calc(100vh-140px)]` and `text-xxs` (a 10px size the config adds) are all normal here.

**Spacing** through flex or grid plus `gap-*` / `space-y-*`, not margins on every child.

**`style={{}}` only for a value that is computed at runtime** — a width from a measurement, a colour
that arrives in data. There are 68 such uses. A static value belongs in a class.

**Animation.** `tailwindcss-animate` is installed and the config defines `accordion-down` /
`accordion-up` for the Radix accordion. Prefer those over a bespoke keyframe.

**If you add a source directory**, add it to each app's `content` array. Every app already includes
`../../packages/ui/src/**/*.{ts,tsx}`, which is what makes classes written inside the package
survive the purge — a class that only ever appears in `packages/ui` and is missing from `content`
silently produces no CSS.

## Changing the theme

Use the `add-a-theme` skill for this — it owns the token vocabulary, the `<role>`/
`-foreground` contract, adding a third theme, the contrast script every palette has to pass,
and the move from `tw-colors` to CSS variables. The short version:

1. Edit `packages/ui/src/themes/light.ts` **and** `dark.ts` — a token must exist in both, or the
   class disappears in one mode.
2. Keep the nesting shallow: `group: { shade: value }` becomes `group-shade`.
3. Nothing needs a rebuild; the package is consumed as source. Restart the dev server so Tailwind
   re-reads its config.

Dark mode is `darkMode: ['class', '[data-theme="dark"]']`, and `_app.tsx` toggles the `dark` class
on `document.documentElement` through `ColorModeContext`. A component never reads the mode to pick
a colour — that is what the tokens are for.

## Debugging a class that does nothing

Work down this list:

1. Is it one of shadcn's token names? See must #2 — it resolves to nothing.
2. Does the token exist in `light.ts`? Remember the flattening: `bg-background-primary`, not
   `bg-background.primary` or `bg-primary`.
3. Is the file inside a `content` glob?
4. Is something else winning? With `important: true`, suspect an inline `style` or a later utility
   in the same `cn()` call rather than specificity.
5. Confirm in the built CSS rather than guessing:
   `grep -c '\.bg-background-primary' apps/teaching/.next/static/css/*.css`
