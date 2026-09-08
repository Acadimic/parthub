---
description: >
  Create a new core wrapper component in packages/ui/src/core/ that wraps a shadcn UI primitive
  from packages/ui/src/ui/. Use this skill BEFORE creating any new UI component that a feature
  module needs. Feature code in the apps (modules/, layouts/, pages/) must NEVER import shadcn
  primitives directly. Instead, create or use a core wrapper that adds label, error, and a
  consistent API, imported from `@repo/ui/core`.
when_to_use: >
  Trigger when: (1) a feature module needs a UI element that has no core wrapper yet,
  (2) someone asks to add a form field, input, select, dialog, or any UI primitive to a feature,
  (3) you see a direct import from `@repo/ui/ui/*` in feature code.
argument-hint: "[component-name]"
---

# Create Core Component

All shared React UI lives in the `@repo/ui` workspace package (`packages/ui`). The three Next.js
apps (`apps/learning`, `apps/teaching`, `apps/admin`) consume it as TypeScript source through
`transpilePackages`, so a component added there is available to every app with no build step.

## Architecture Rules

1. **Two-layer component system (inside `packages/ui/src`):**
   - `ui/<name>.tsx` — Raw shadcn primitives (kebab-case files). NEVER import these in app feature code.
   - `core/<Name>/index.tsx` — Wrappers that compose `ui/` primitives with label, error, and a consistent
     props API. Exported from `core/index.ts`, which is what `@repo/ui` and
     `@repo/ui/core` expose.

2. **Feature code** (`modules/`, `layouts/`, `pages/` in any app) imports wrappers from
   `@repo/ui/core` and composed components from `@repo/ui/app`. There are no pass-through
   component barrels in the apps. If a core wrapper doesn't exist yet, create one first.

3. **Imports inside `packages/ui` are relative** (`../../ui/button`, `../../lib/cn`, `../../types`).
   Never use app path aliases such as `@components/*` or `@utils/*` there — they don't resolve in the package.

## Steps

1. **Check if a core wrapper already exists** — look in `packages/ui/src/core/` and the table below.
2. **Make sure the primitive exists** in `packages/ui/src/ui/`. If not, add the shadcn primitive there
   first (copy the generated file, then change its `@/lib/utils` import to `../lib/cn` and any
   `@/components/ui/x` import to `./x`).
3. **Read an existing wrapper** such as `core/TextInput/index.tsx` or `core/Select/index.tsx` as the pattern.
4. **Create `packages/ui/src/core/<Name>/index.tsx`** following the pattern below.
5. **Export it** from `packages/ui/src/core/index.ts` (component and its props type).
6. **Typecheck** with `pnpm typecheck:ui`, then typecheck the app that will use it.
7. **Update feature code** to import the wrapper from `@repo/ui/core`.

## Pattern to Follow

```tsx
import { ClassValue } from 'clsx';
import { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Label } from '../Label';
import { ShadcnComponent } from '../../ui/component-name';

export interface IComponentProps extends React.ComponentProps<typeof ShadcnComponent> {
  id?: string;
  label?: ReactNode;
  error?: ReactNode;
  classNames?: {
    root?: ClassValue;
    label?: ClassValue;
    // component-specific key (e.g. input, trigger)
    error?: ClassValue;
  };
}

export const Component = ({ id, label, error, classNames = {}, className, ...props }: IComponentProps) => {
  return (
    <div className={cn('grid w-full items-center gap-2', classNames.root)}>
      {label && (
        <Label htmlFor={id} className={cn(classNames.label)} required={props.required}>
          {label}
        </Label>
      )}
      <ShadcnComponent id={id} className={cn(className)} {...props} />
      {error && <div className={cn('text-sm text-red-primary', classNames.error)}>{error}</div>}
    </div>
  );
};
```

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

## The `app/` layer

`packages/ui/src/app/` holds components composed from these wrappers, such as SplitButton,
DateInput, Carousel and Menu. It is a separate subpath (`@repo/ui/app`) because fourteen names
exist in both layers with different APIs. Put a new component there when it combines several core
wrappers rather than wrapping a single primitive. See `packages/ui/README.md` for the layer rules,
including which components deliberately stay in the apps.

## Argument

If invoked as `/create-core-component <name>`, create a core wrapper for the `<name>` component
(e.g. `/create-core-component switch`).
