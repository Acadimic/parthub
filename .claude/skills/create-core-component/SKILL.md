---
description: >
  Create a new core wrapper component in packages/ui/src/core/ that wraps a shadcn UI primitive
  from packages/ui/src/ui/. Use this skill BEFORE creating any new UI component that a feature
  module needs. Feature code in the apps (modules/, layouts/, pages/) must NEVER import shadcn
  primitives directly. Instead, create or use a core wrapper that adds label, error, and a
  consistent API, imported from `@repo/ui/core`.
when_to_use: >
  Trigger when a UI element is needed and no core wrapper exists for it yet, which is step 3 of
  the `use-ui-component` skill. That skill is the entry point for any UI work and decides whether
  a wrapper is needed at all; this one creates it. Also trigger on a direct import from
  `@repo/ui/ui/*` in feature code, which means a wrapper is missing.
argument-hint: "[component-name]"
---

# Create Core Component

Reach this skill through `use-ui-component`, which checks first whether an app component or an
existing wrapper already covers the need. Only create a new wrapper when neither does.

All shared React UI lives in the `@repo/ui` workspace package (`packages/ui`). The three Next.js
apps (`apps/learning`, `apps/teaching`, `apps/support`) consume it as TypeScript source through
`transpilePackages`, so a component added there is available to every app with no build step.

## Architecture Rules

1. **Three-layer component system (inside `packages/ui/src`):**
   - `ui/<name>.tsx` — Raw shadcn primitives (kebab-case files). NEVER import these in app feature code.
   - `core/<Name>/index.tsx` — Wrappers that compose `ui/` primitives with label, error, and a consistent
     props API. Exported from `core/index.ts`, which is what `@repo/ui` and
     `@repo/ui/core` expose. **This is what you create here.**
   - `app/<group>/<Name>.tsx` — Components composed from several wrappers, exposed on
     `@repo/ui/app`.

2. **Feature code** (`modules/`, `layouts/`, `pages/` in any app) imports wrappers from
   `@repo/ui/core` and composed components from `@repo/ui/app`. There are no pass-through
   component barrels in the apps. If a core wrapper doesn't exist yet, create one first.

3. **Imports inside `packages/ui` are relative** (`../../ui/button`, `../../lib/cn`, `../../types`).
   Never use app path aliases such as `@components/*` or `@utils/*` there — they don't resolve in the package.

## Steps

1. **Check if a core wrapper already exists** — look in `packages/ui/src/core/` and the table below.
2. **Make sure the primitive exists** in `packages/ui/src/ui/`. If not, add it first — see
   "Adding a shadcn primitive" below.
3. **Read an existing wrapper** such as `core/TextInput/index.tsx` or `core/Select/index.tsx` as the pattern.
4. **Create `packages/ui/src/core/<Name>/index.tsx`** following the pattern below.
5. **Export it** from `packages/ui/src/core/index.ts` (component and its props type).
6. **Typecheck** with `pnpm typecheck:ui`, then typecheck the app that will use it.
7. **Update feature code** to import the wrapper from `@repo/ui/core`.

## Pattern to Follow

Taken from `core/TextInput/index.tsx`. The label, the `required` asterisk, the error state and the
helper text are the wrapper's job; the caller passes flags, not markup.

```tsx
import { cn } from '../../lib/cn';
import { Label } from '../Label';
import { ShadcnComponent } from '../../ui/component-name';

export interface IComponentProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  /** Classes for the control itself; `className` styles the wrapper around it. */
  inputClassName?: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
}

export const Component = ({ label, required, error, helperText, inputClassName, className, ...rest }: IComponentProps) => {
  return (
    <div className={className}>
      {label && <Label label={label} required={required} />}
      <ShadcnComponent
        {...rest}
        className={cn(
          'text-sm font-medium bg-transparent',
          error ? 'border-red-primary' : 'border-color-border',
          inputClassName,
        )}
      />
      {helperText && (
        <p className={cn('text-xs mt-1', error ? 'text-red-primary' : 'text-color-secondary')}>{helperText}</p>
      )}
    </div>
  );
};
```

**`error` is a boolean, `helperText` is the message.** Every input wrapper in the package works
this way; a wrapper taking `error: ReactNode` would be the odd one out. Colours come from theme
tokens — see the `style-with-tailwind` skill, and never use shadcn's own `border-input` or
`ring-ring` class names, which resolve to nothing here.

## Key Conventions

- **File location:** `packages/ui/src/core/<Name>/index.tsx` (PascalCase folder, `index.tsx` inside)
- **Props type:** exported as `I<Name>Props` and re-exported from `core/index.ts`
- **Imports:** relative paths only; `cn` comes from `../../lib/cn`
- **Shared types:** React-aware item types (`ISelectItem`, `IMenuItem`, `IColumnData`, ...) live in
  `packages/ui/src/types`; pure data types and enums live in `@repo/shared`
- **Icons:** `@phosphor-icons/react`
- **Styling:** Tailwind classes; theme colors come from `packages/ui/src/themes` via the `tw-colors` plugin
  (e.g. `text-color-primary`, `bg-background-secondary`, `text-red-primary`)
- **No "use client"** — the apps use the Pages Router

## Existing Core Components

Already in `packages/ui/src/core/` — do NOT recreate them:

Accordion, AlertDialog, Avatar, Badge, Breadcrumb, Button, Card, Checkbox, DateInput, Label, Link,
Menu, Modal, Popover, Progress, RadioGroup, ScrollArea, Select, Separator, Skeleton, Spinner, Table,
Tabs, TextInput, Tooltip.

Primitives available in `packages/ui/src/ui/` without a wrapper yet: command, dropdown-menu, input,
sheet, switch, textarea, dialog (used by Modal).

## Adding a shadcn primitive

The 26 primitives live in `packages/ui/src/ui/`, one kebab-case file each, and they are the only
files in the repo that may be shadcn output verbatim.

**The generated file always needs two edits**, because the CLI writes shadcn's own aliases:

| Generated              | Change to      |
| ---------------------- | -------------- |
| `@/lib/utils`          | `../lib/cn`    |
| `@/components/ui/<x>`  | `./<x>`        |

Then check the file against the ones already there:

- **Leave `"use client"` out of a wrapper.** These apps are on the Pages Router, where the
  directive does nothing. No file in `core/` or `app/` has one. Six generated primitives
  (`tabs`, `popover`, `progress`, `scroll-area`, `avatar`, `command`) still carry theirs from
  shadcn; it is inert, so leave it rather than churn the file.
- Keep the `React.forwardRef` shape and the `cn(...)` class merge as generated — a wrapper depends
  on being able to pass `className` through.
- Icons in a wrapper or in feature code come from `@phosphor-icons/react`. A generated primitive
  keeps whatever it came with: nine of them import `lucide-react`, which is why that package is a
  `packages/ui` dependency. Leave those as they are rather than churning the file.
- Theme colours come from `packages/ui/src/themes` through the `tw-colors` plugin, so prefer
  `text-color-primary` / `bg-background-secondary` / `text-red-primary` over raw palette classes
  when you touch the classes at all.
- A new Radix dependency goes in `packages/ui/package.json`, not an app's.

**Copy the file in by hand; there is no CLI path.** The apps used to carry a `components.json`
pointing the shadcn CLI at `@components/ui` and `@utils/cn`, which is where the primitives lived
before they moved into this package. Those configs were deleted once they became wrong, so the CLI
now fails with "no components.json" instead of quietly writing a primitive into an app, installing
dependencies into that app, and possibly rewriting its `globals.scss` and Tailwind config.

Take the source from https://ui.shadcn.com/docs/components/<name> — check it there rather than
from memory, since the components change — and paste it into `packages/ui/src/ui/<name>.tsx` with
the two import rewrites above. Re-adding a `components.json` for the package is not worth it: the
CLI needs a Tailwind config and a stylesheet in the same package, and `packages/ui` has neither
(each app owns its `tailwind.config.js` and pulls the palettes from `packages/ui/src/themes`).

After adding the primitive, continue at step 3: a primitive with no wrapper is not usable by
feature code, because an app importing `@repo/ui/ui/*` is an ESLint error.

## The `app/` layer

`packages/ui/src/app/` holds components composed from these wrappers, such as SplitButton,
DateInput, Carousel and Menu. It is a separate subpath (`@repo/ui/app`) because fourteen names
exist in both layers with different APIs. Put a new component there when it combines several core
wrappers rather than wrapping a single primitive. See `packages/ui/README.md` for the layer rules,
including which components deliberately stay in the apps.

## Argument

If invoked as `/create-core-component <name>`, create a core wrapper for the `<name>` component
(e.g. `/create-core-component switch`).
