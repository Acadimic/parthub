---
description: >
  How to style anything in these apps: the shadcn token vocabulary and where it comes from, the
  radius and type scales, why you never write a `dark:` variant for colour, and what
  `important: true` in the Tailwind config means for you. Use it before writing a className,
  editing a theme, or touching a Tailwind config or stylesheet.
when_to_use: >
  Trigger when writing or changing any `className`, when picking a colour, when a class you expect
  to work has no visible effect, before editing `packages/ui/src/themes`, an app's
  `tailwind.config.js` or `globals.scss`, before adding a `dark:` variant or a `style={{}}` block,
  and when adding an icon.
argument-hint: '[what you are styling]'
---

# Style with Tailwind

TailwindCSS 3 in all three apps. The palette, the radius scale, the type scale and the keyframes
all come from one shared preset — `packages/ui/src/themes/preset.ts` — which each app's
`tailwind.config.js` spreads through `presets: [uiPreset]`. An app config holds only its `content`
globs and `tailwindcssAnimate`.

The tokens are **shadcn's own vocabulary**: `bg-background`, `text-muted-foreground`,
`bg-primary text-primary-foreground`, `ring-ring`, `border-input`. They are emitted as CSS custom
properties from `packages/ui/src/themes/{light,dark}.ts` — see `add-a-theme`, which owns how that
works and how to change it.

## must

1. **Colour comes from a token. Never a hex, never an arbitrary colour value, never a raw Tailwind
   palette shade.** `bg-[#009ef7]`, `bg-blue-600` and `text-green-800` all hard-code one theme and
   go wrong the moment the user switches. The repo is currently at **zero** arbitrary hex colour
   classes; do not add the first. If a colour you need is missing, it is a missing token — add it
   to **both** `light.ts` and `dark.ts` via `add-a-theme` and use the new token.

   The two standing exceptions, both deliberate: `bg-black/50` and `bg-black/80` modal scrims, which
   are theme-neutral by design, and the solid `bg-black` marketing panel on the auth screens, which
   exists to carry a dark-variant logo.

2. **No `dark:` variants for colour.** Every token already has a per-theme value, so `bg-background`
   is white in light mode and near-black in dark mode by itself. The repo has **zero** `dark:`
   colour classes and should stay there. The one `dark:` usage is a filter, not a colour:
   `RichTextImage` inverts a drawn SVG figure (`dark:invert dark:hue-rotate-180`), because an image
   cannot take theme tokens. Writing `bg-white dark:bg-black` rebuilds by hand what the theme
   does for you, and then drifts from it. A `dark:` variant that patches a hard-coded colour is two
   bugs, not one.

3. **`<role>` and `<role>-foreground` travel together.** `bg-primary text-primary-foreground` is
   legible by construction, and the contrast script enforces it. Never pair a fill from one role
   with text from another, and never pick a text colour to sit on a fill — the pairing already
   exists.

4. **Merge classes with `cn`,** from `@repo/ui/lib` inside an app or `../../lib/cn` inside the
   package, and put the caller's `className` **last** so a caller can override:
   `cn('px-3 text-sm', error && 'border-destructive', className)`.

5. **`globals.scss` is not for component styling.** It holds `@tailwind` directives, resets,
   scrollbar rules and a couple of `@layer utilities` helpers such as `.no-scrollbar`. A component's
   appearance belongs in its classes. `apps/teaching/src/styles/calendar.scss` is the one exception:
   third-party FullCalendar internals that cannot be reached with utilities.

6. **`important: true` is set in every app's config.** Every Tailwind utility therefore emits
   `!important`. Two consequences: a plain CSS rule cannot override a utility, and an inline
   `style={{}}` still beats one. Do not try to win a conflict with a longer selector — change the
   class.

## The tokens

Surfaces and text, which is what most code needs:

| Token                                | Use for                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `background` / `foreground`          | the base surface and its text                                             |
| `muted` / `muted-foreground`         | the page canvas; secondary and helper text                                |
| `card` / `popover` (+ `-foreground`) | raised surfaces — cards, dropdowns, dialogs                               |
| `panel` / `panel-foreground`         | a primary-tinted frame around content with its own surface (a group card) |
| `accent` / `secondary`               | hover and active fills                                                    |
| `border` / `input` / `ring`          | dividers and outlines, field borders, focus rings                         |

Roles that carry meaning. Each has a `-foreground` partner:

| Token                          | Use for                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `primary`                      | the one interactive hue — buttons, links, active nav, selection |
| `destructive`                  | errors and destructive actions                                  |
| `success` / `warning` / `info` | status only                                                     |
| `brand`                        | product identity (the logo mark). Never on anything clickable   |
| `chart-1` … `chart-5`          | categorical data — series, tags. Never a state                  |

Two rules of thumb the palette depends on. `primary` is the _only_ interactive colour, so
`text-primary` means "you can click this" — emphasis text is `text-foreground`. And a status colour
earns its keep by being rare: the chrome is deliberately neutral so that anything coloured means
something.

**Opacity modifiers work on every token** — `bg-primary/90`, `bg-success/15`, `border-info/30`.
That is what soft status pills are built from; see the `Badge` core component for the pattern.

**Only steps of five exist.** Tailwind's opacity scale is `0 5 10 15 … 100`, so `bg-success/12`
compiles to _nothing at all_ — no class, no warning, and a pill with a transparent fill that looks
almost right. Round to a step on the scale, or write an arbitrary value (`bg-success/[0.12]`) if you
genuinely need one.

## The other scales

- **Radius: the interface is square.** `--radius` is `0rem`, and every step (`rounded`,
  `rounded-sm` … `rounded-3xl`) is a _multiple_ of it, so they all compute to 0. Do not write
  `rounded-none` to get a sharp corner — you already have one; and do not reach for an arbitrary
  `rounded-[6px]` to escape it, which just reintroduces the thing the knob exists to control.
  To round the product later, change `--radius` in `preset.ts` alone: `0.5rem` gives back a
  4/6/8/12px ladder with its size hierarchy intact.

  `rounded-full` and `rounded-none` are deliberately _not_ derived — an avatar, a spinner or a pill
  stays circular whatever the knob says.

  The steps are multiples rather than offsets for a specific reason: with `calc(var(--radius) - 4px)`
  a knob of 0 yields a negative radius, which is invalid CSS that browsers drop silently, leaving
  one step rounded while the rest went sharp.

  Stylesheet rules that Tailwind cannot reach — the scrollbar thumb, FullCalendar's popovers — use
  `border-radius: var(--radius)` directly so they follow the same knob.

- **Type** is Tailwind's own scale, left intact on purpose — a parallel set of names alongside it is
  how `text-sm` and `text-body` end up meaning the same thing. Two additions: `text-xxs` (10px) and
  `tracking-caps`, for the uppercase micro-labels above a list or in a table header.
- **Fonts** are `font-sans` (Inter, then a system stack) and `font-mono`. Use `font-mono` for
  columns of figures — proportional digits do not line up.

**Icons.** Phosphor (`@phosphor-icons/react`), sized with a class rather than a prop. The house
style is `weight="bold"` with `className="w-4 h-4"` inline, `w-5 h-5` in a header or a standalone
action. Use the `*Icon` export names (`CaretDownIcon`, `PencilIcon`); the unsuffixed aliases are
deprecated and warn. A decorative icon takes `text-muted-foreground`, not `text-primary` — colour
it only when it is part of something interactive.

## should

**Responsive layout.** Mobile-first Tailwind prefixes, as the existing forms do:
`flex flex-col md:flex-row`, `w-full md:w-[50%]`. Reach for `useWindowDimensions()` from
`@repo/ui/hooks` only when JavaScript needs the value — it returns `width`, `height`,
`isSmallScreen` (≤768), `isMediumScreen` (769–1024) and `isLargeScreen` (>1024). Layout that CSS
can express should stay in CSS.

**Arbitrary values are fine for geometry, not for colour.** `min-h-[60vh]`, `w-[50%]` and
`h-[calc(100vh-140px)]` are all normal here.

**Spacing** through flex or grid plus `gap-*` / `space-y-*`, not margins on every child.

**`style={{}}` only for a value that is computed at runtime** — a width from a measurement, a colour
that arrives in data. There are 66 such uses. A static value belongs in a class.

**Animation.** `tailwindcss-animate` is installed and the preset defines `accordion-down` /
`accordion-up` for the Radix accordion. Prefer those over a bespoke keyframe.

**If you add a source directory**, add it to each app's `content` array. Every app already includes
`../../packages/ui/src/**/*.{ts,tsx}`, which is what makes classes written inside the package
survive the purge — a class that only ever appears in `packages/ui` and is missing from `content`
silently produces no CSS.

## Changing the theme

Use the `add-a-theme` skill — it owns the token vocabulary, the `<role>`/`-foreground` contract,
adding a third theme, and the contrast script every palette has to pass. The short version:

1. Edit `packages/ui/src/themes/light.ts` **and** `dark.ts`. A token must exist in both; the
   config throws at load if they disagree.
2. Keys are flat: `'primary-foreground'`, not `primary: { foreground }`.
3. Nothing needs a rebuild; the package is consumed as source. **Restart the dev server** so
   Tailwind re-reads its config.

Dark mode is `darkMode: ['class', '[data-theme="dark"]']`, and `_app.tsx` sets `data-theme` on a
wrapper div through `ColorModeContext`. A component never reads the mode to pick a colour — that is
what the tokens are for.

## Debugging a class that does nothing

Work down this list:

1. Does the token exist in `light.ts`? A plausible-looking name that was never a token —
   `text-text-primary`, `bg-background-hover`, `text-light-muted` — produces no rule and no error.
   All three of those were found live in this repo, survivors of an older palette.
2. Is the file inside a `content` glob?
3. Did you restart the dev server after a theme or preset edit? Tailwind reads its config once.
4. Is something else winning? With `important: true`, suspect an inline `style` or a later utility
   in the same `cn()` call rather than specificity.
5. Confirm in the built CSS rather than guessing. The palette is emitted as HSL custom properties,
   so grepping the stylesheet for your hex finds nothing and proves nothing:

   ```bash
   CSS=$(find apps/teaching/.next/static -name '*.css' | head -1)
   grep -o ':root{[^}]*}' "$CSS"            # the light palette + --radius
   grep -o '\[data-theme=dark\]{[^}]*}' "$CSS"
   grep -c '\.bg-primary' "$CSS"
   ```
