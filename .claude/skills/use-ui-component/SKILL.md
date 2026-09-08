---
description: >
  The required first step before writing any UI in a feature. Never hand-roll an element or
  reach for a shadcn primitive: check `@repo/ui` for an existing core wrapper or app component
  and use it. If no core wrapper exists for what you need, create the wrapper in
  `packages/ui/src/core/` FIRST, then compose the feature component from it. This keeps every
  input, button, modal and table in the three apps on one API.
when_to_use: >
  Trigger BEFORE writing or editing any component, page or module that renders UI. Specifically:
  (1) a request to add or change a form, field, input, select, dropdown, dialog, modal, table,
  card, tabs, tooltip, accordion, badge, avatar, menu, stepper or loader anywhere in
  apps/learning, apps/teaching or apps/admin; (2) you are about to write raw JSX for an element
  that looks like a shared control (`<input`, `<button`, `<table`, `<select`, `<dialog`);
  (3) you are about to import from `@repo/ui/ui/*`; (4) you catch yourself copying a component
  between apps or between modules.
argument-hint: '[what you are building]'
---

# Use a UI component from the library

All shared UI lives in `@repo/ui` (`packages/ui`), consumed as TypeScript source, so anything
added there is instantly available to `learning`, `teaching` and `admin`. Read
`packages/ui/README.md` for the full layer rules.

**The rule: feature code composes library components. It does not create shared UI inline, and it
never imports a raw primitive.**

## The decision, in order

Work down this list and stop at the first match.

1. **An app component already does it** → import from `@repo/ui/app`.
   Composed, opinionated pieces: `SplitButton`, `DateInput`, `TimeInput`, `Switch`, `TextArea`,
   `Carousel`, `Menu`, `MenuList`, `Dropdown`, `FullScreenModal`, `SoftConfirmModal`, `Confirm`,
   `Loader`, `FullScreenLoader`, `BackdropLoader`, `Tabs`, `Accordions`, `SimpleAccordions`,
   `Logo`, `FullLogo`, `CircularProgress`, `RectangleSkeleton`, `ToggleTheme`, `InternetStatus`.

2. **A core wrapper already does it** → import from `@repo/ui/core`.
   The 25 wrappers: Accordion, AlertDialog, Avatar, Badge, Breadcrumb, Button, Card, Checkbox,
   DateInput, Label, Link, Menu, Modal, Popover, Progress, RadioGroup, ScrollArea, Select,
   Separator, Skeleton, Spinner, Table, Tabs, TextInput, Tooltip.

3. **Neither exists, but a shadcn primitive does** → **create the core wrapper first.**
   Run `/create-core-component <name>`, then import the new wrapper in your feature component.
   Primitives currently sitting in `packages/ui/src/ui/` with no wrapper yet: `command`, `sheet`,
   `switch`, `textarea`.

4. **No primitive either** → add the shadcn primitive to `packages/ui/src/ui/`, then go to step 3.
   Copy the generated file, change its `@/lib/utils` import to `../lib/cn` and any
   `@/components/ui/x` to `./x`.

5. **It is genuinely feature-specific** → build it in the app, under `src/modules/<feature>/`,
   composed from the components above. A component only one screen will ever use does not belong
   in the library.

Never skip to writing raw JSX for a control that steps 1 to 3 could supply. If you are unsure
whether something is shared UI or feature UI, ask: would a second screen plausibly want this? If
yes, it is library work.

## Checking, rather than guessing

```bash
# is there already a wrapper or an app component for this?
ls packages/ui/src/core/
grep -rl "export const" packages/ui/src/app | xargs grep -ho "export const \w*" | sort -u

# is a primitive available to wrap?
ls packages/ui/src/ui/
```

## Importing

```ts
// composed components
import { SplitButton, FullScreenModal } from '@repo/ui/app';
// wrappers
import { Button, Select, TextInput } from '@repo/ui/core';
// shared item types the props expect
import type { ISelectItem, IMenuItem, IColumnData } from '@repo/ui/types';
```

There are no pass-through barrels in the apps. Import the package directly.

`core` and `app` are separate subpaths because fourteen names exist in both with different APIs:
Breadcrumb, Button, Card, Checkbox, DateInput, Label, Link, Menu, Modal, Popover, Spinner, Tabs,
TextInput and Tooltip. Pick the layer you actually want, and never import both into one file
without aliasing.

## What must not happen

- `import { Input } from '@repo/ui/ui/input'` in feature code. Wrap it, then use the wrapper.
- A bare `<input>`, `<select>`, `<table>` or `<dialog>` for something a wrapper covers.
- The same component pasted into two apps, or into two modules. Move it to the library instead,
  following "Moving an app component in" in `packages/ui/README.md`.
- A component in `packages/ui` that reads app state. No `@stores`, no `@services`, no MobX.
  Everything arrives through props. That is why some components deliberately stay in the apps.

## After you add to the library

```bash
pnpm typecheck:ui
```

Then typecheck at least one app, because the package is consumed as source and a break surfaces
only there:

```bash
pnpm --filter @repo/teaching exec tsc --noEmit
```
