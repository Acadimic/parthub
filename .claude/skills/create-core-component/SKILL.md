---
description: >
  Create a new core wrapper component in client/src/components/core/ that wraps a shadcn UI primitive.
  Use this skill BEFORE creating any new UI component that a feature module needs.
  Feature modules (modules/, layouts/, pages/) must NEVER import directly from components/ui/.
  Instead, create or use a core wrapper that adds label, error, and consistent styling.
when_to_use: >
  Trigger when: (1) a feature module needs a UI element that has no core wrapper yet,
  (2) someone asks to add a form field, input, select, dialog, or any UI primitive to a feature,
  (3) you see a direct import from components/ui/ in feature code.
argument-hint: "[component-name]"
---

# Create Core Component

You are creating a new core wrapper component at `client/src/components/core/`.

## Architecture Rules

1. **Two-layer component system:**
   - `components/ui/` — Raw shadcn primitives. NEVER import these in feature code.
   - `components/core/` — Wrappers that compose `ui/` primitives with labels, errors, and consistent API. Feature code imports ONLY from here.

2. **Feature code** (`modules/`, `layouts/`, `pages/`) must NEVER import from `components/ui/` directly for form-related components. If a core wrapper doesn't exist yet, create one first.

## Steps

1. **Check if a core wrapper already exists** — search `client/src/components/core/` for the component name.
2. **Read the shadcn primitive** being wrapped in `client/src/components/ui/`.
3. **Read the existing `input.tsx` core wrapper** as the reference pattern to follow.
4. **Create the new core component** following the pattern below.
5. **Update feature code** to import from `core/` instead of `ui/`.

## Pattern to Follow

Reference: `client/src/components/core/input.tsx`

Every core form component MUST follow this structure:

```tsx
import { cn } from "@/lib/utils/util";
import { ClassValue } from "clsx";
import { ReactNode } from "react";
import { Label } from "../ui/label";
import { ShadcnComponent as ShadCnComponent } from "../ui/component-name";

type ComponentProps = {
  id?: string;
  label?: ReactNode;
  labelProps?: React.ComponentProps<typeof Label>;
  placeholder?: string;
  error?: ReactNode;
  classNames?: {
    root?: ClassValue;
    label?: ClassValue;
    // component-specific class key (e.g., input, textarea, trigger)
    error?: ClassValue;
  };
} & React.ComponentProps<"underlying-element">; // if applicable

export const Component = ({
  label,
  labelProps = {},
  id,
  placeholder = "",
  error,
  classNames = {},
  className,
  ...componentProps
}: ComponentProps) => {
  return (
    <div className={cn("grid w-full max-w-sm items-center gap-2", classNames.root)}>
      {label && (
        <Label
          htmlFor={id}
          className={cn(labelProps.className || classNames.label)}
          asterisk={componentProps.required}
          {...labelProps}
        >
          {label}
        </Label>
      )}
      <ShadCnComponent
        id={id}
        placeholder={placeholder}
        className={cn(className || classNames.componentKey)}
        {...componentProps}
      />
      {error && <div className={cn("text-destructive text-sm", classNames.error)}>{error}</div>}
    </div>
  );
};
```

## Key Conventions

- **File location:** `client/src/components/core/<component-name>.tsx`
- **Imports:** Use relative paths to `../ui/` for shadcn primitives
- **Label:** Optional, rendered above the component, uses `Label` from `../ui/label`
- **Error:** Optional, rendered below the component, uses `text-destructive text-sm`
- **classNames:** Object with `root`, `label`, component-specific key, and `error` — all typed as `ClassValue`
- **Re-exports:** If the wrapped component has sub-components consumers need (e.g., `SelectItem`), re-export them
- **No "use client"** unless the component uses hooks or browser APIs

## Existing Core Components

These already exist — do NOT recreate them:

| Component | File | Wraps |
|-----------|------|-------|
| Input | `core/input.tsx` | `ui/input` + Label + error |
| Select | `core/select.tsx` | `ui/select` + Label + error, re-exports `SelectItem` |
| Textarea | `core/textarea.tsx` | `ui/textarea` + Label + error |
| FormModal | `core/form-modal.tsx` | `core/modal` + header/body/footer + cancel/save buttons |
| Modal | `core/modal.tsx` | `ui/dialog` + `ui/drawer` (responsive) |
| SearchInput | `core/search-input.tsx` | Search-specific input |
| Spinner | `core/spinner.tsx` | Loading spinner |

## Argument

If invoked as `/create-core-component <name>`, create a core wrapper for the `<name>` component (e.g., `/create-core-component checkbox`).
