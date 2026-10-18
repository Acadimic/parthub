# @repo/ui

Every shared React component for the `learning`, `teaching` and `support` apps.

The package is consumed as TypeScript source through `transpilePackages`, so it
has no build step. A change here is picked up by all three apps immediately.
`pnpm typecheck:ui` typechecks it.

## Layers

```
packages/ui/src/
  ui/        shadcn primitives          26 files   never imported by feature code
  core/      wrappers over ui/          25 dirs    label, error, consistent props
  app/       composed app components    46 files   built from core/
  lib/       cn, dates, helpers         5 files    no React
  types/     React-aware item types     3 files    ISelectItem, IMenuItem, IColumnData
  contexts/  colour mode                2 files
  hooks/     useWindowDimensions        2 files
  themes/    light and dark palettes    4 files    consumed by each tailwind.config.js
             (see the style-with-tailwind skill for the token names)
```

The three component layers stack in one direction only. `ui/` knows nothing
above it, `core/` composes `ui/`, and `app/` composes `core/`. Nothing in the
package imports an app.

## Import subpaths

| Import              | Contents                                                        |
| ------------------- | --------------------------------------------------------------- |
| `@repo/ui`          | `core/`, `contexts/`, `hooks/`                                  |
| `@repo/ui/core`     | the wrappers: Button, TextInput, Select, Modal, Table, ...      |
| `@repo/ui/app`      | the composed layer: SplitButton, DateInput, Carousel, Menu, ... |
| `@repo/ui/ui/*`     | a single shadcn primitive, e.g. `@repo/ui/ui/switch`            |
| `@repo/ui/lib`      | `cn`, date helpers, browser-safe utilities, `toPayload`         |
| `@repo/ui/types`    | `ISelectItem`, `IMenuItem`, `IColumnData`, `IStep`, `IColor`    |
| `@repo/ui/contexts` | `ColorModeContext`                                              |
| `@repo/ui/hooks`    | `useWindowDimensions`                                           |
| `@repo/ui/themes`   | `light`, `dark`, `getTheme`                                     |
| `@repo/ui/content`  | `RichTextView`, `MathRender` — what a student downloads         |
| `@repo/ui/editor`   | `RichTextEditor`, the equation editor and its data              |
| `@repo/ui/print`    | A4 printouts of a course or a test paper, through the browser   |

The `content` and `editor` subpaths — the document model, what the editor can hold, Markdown import
and export, equation handling — are documented in `src/editor/README.md`.

**`core` and `app` are separate subpaths on purpose.** Fourteen names exist in
both with a different API: `Breadcrumb`, `Button`, `Card`, `Checkbox`,
`DateInput`, `Label`, `Link`, `Menu`, `Modal`, `Popover`, `Spinner`, `Tabs`,
`TextInput` and `Tooltip`. A single barrel would make those ambiguous, so `app`
is never re-exported from the root.

## How the apps consume it

Feature code imports the package directly. There are no pass-through barrels.

```ts
import { Button, FullScreenLoader, TextInput } from '@repo/ui/app';
import { DataTable } from '@components/app/tables';
```

An app barrel exists only where that folder still holds its own components, and
it exports those and nothing else. A folder whose contents all moved here has no
`index.ts` at all.

The trade-off is deliberate: an import now says where the component comes from,
and nothing is hidden behind a re-export. The cost is that moving a component
into this package later means updating its call sites, so check
`git grep` before moving one.

## Rules

1. **Feature code never imports `ui/`.** It imports `@repo/ui/core` for a
   wrapper or `@repo/ui/app` for a composed component. Use
   `/create-core-component` to add a wrapper.
2. **Inside the package, imports are relative.** `../../lib/cn`, not
   `@utils/cn`. An app path alias does not resolve here.
3. **A component in the package may not read app state.** No `@stores`, no
   `@services`, no `zustand`. Everything arrives through props.
4. **Shared data types come from `@repo/shared`.** `types/` holds only the
   types that need React, such as a `ReactNode` label.
5. **One component per file, named after the file.** The folder's `index.ts`
   re-exports it.
6. **No barrel self-imports.** Import the module that defines a component
   (`../loaders/Spinner`), never the folder barrel above it (`..`), and never
   this package's own `@repo/ui/*` subpaths. Doing the latter makes every
   component transitively depend on every other one, which is what previously
   kept 17 shareable components stuck in the apps.

Rules 2, 3 and 6 are enforced: `no-restricted-imports` in `eslint.config.js`
(from `@repo/eslint-config`) fails the lint on an app alias, on `zustand`, on an
`@repo/ui` subpath and on `from '..'`. Rule 1 is enforced from the other side —
an app may not import `@repo/ui/ui/*`.

## Loading images

Every remote picture loads the same way: **a shimmer holds its space, and the picture fades in
once it has downloaded**, not merely once its address is signed. Nothing pops in and nothing
below it jumps.

- **Never render a bare `<img>` for a stored or remote picture.** Use the component that owns it:

  | Picture                                  | Component                                                    |
  | ---------------------------------------- | ------------------------------------------------------------ |
  | a cover, logo or attachment (learning)   | `PresignedImage` (`src/components/app/attachments`)          |
  | a person                                 | the app's `Avatar` (`src/components/app/avatars`)            |
  | a picture in authored content            | `RichTextImage` (`./content`)                                |
  | a new content block that shows a picture | `useImageReveal` + `REVEAL_FRAME_CLASS` from `RichTextImage` |

- **The fallback is for no picture, not for a slow one.** A course's coloured cover, an avatar's
  initials or the broken-image box shows only when there is no address or the file failed. While
  it loads, show the shimmer (an avatar keeps its initials under the fading photo instead).
- **Reserve the space.** A fixed frame (`PresignedImage` fills its parent's) shows the shimmer at
  its final size. A picture whose height is unknown — authored content — uses `useImageReveal`,
  which holds the shimmer's height and grows the frame to the picture's over 300ms.
- **Fade a wrapper, not the image**, when the caller styles the image: one `transition-*` class
  replaces another, so a fade on the `<img>` would cancel a caller's hover zoom.
- **Handle `onError`.** A picture that fails must end the shimmer, or it shimmers forever.
- **Do not fade a server-rendered `<img>`** (the home banner): it can finish loading before
  hydration, `onLoad` never runs, and it stays invisible. Give it `width`/`height` instead.
- **Print shows pictures whole.** `REVEAL_FRAME_CLASS` and `getRevealImageClass` carry
  `print:h-auto` and `print:opacity-100`; print readiness waits on `data-pending` and `img.complete`
  (`print/use-print-ready.ts`).

The teaching and support apps keep their own `PresignedImage` and avatar, which do not follow this
yet.

## Adding a component

- **A new wrapper over a primitive**: run `/create-core-component`. It puts the
  file in `core/<Name>/index.tsx` and follows the label-and-error pattern.
- **A new composed component**: add it to `app/<group>/<Name>.tsx`, export it
  from `app/<group>/index.ts`, and make sure `app/index.ts` includes the group.
- **A new primitive**: copy the shadcn output into `ui/<name>.tsx`, then change
  its `@/lib/utils` import to `../lib/cn` and any `@/components/ui/x` to `./x`.

Then run `pnpm typecheck:ui` and typecheck at least one app.

## Moving an app component in

1. Check what it imports. If it only touches `core/`, `lib/`, `types/`,
   `themes/`, `contexts/`, a shared enum or another package component, it can move.
2. Check what it imports **transitively**. A clean component that imports a
   coupled sibling by relative path cannot move until that sibling does. This is
   easy to miss.
3. Copy it in, rewrite its aliases to relative paths, and rewrite `@enums` to
   `@repo/shared`.
4. Delete it from every app, and delete the folder's `index.ts` if nothing local
   is left in it.
5. Repoint every call site at `@repo/ui/app`, including sibling components
   that imported it by relative path.

## What deliberately stays in the apps

Twenty-five components in `components/app` are not in the package, in three
groups.

**They read app state.** `PageHeader`, `ExamHeader`, `ExamFooter`, `Timer`,
`AppSidebar`, `ProfileDropdown`, `GroupAvatars`, `DocumentLink` and `Stepper`
subscribe to an app's Zustand stores. Moving them would make the package depend on an app's
state, which rule 3 forbids. They are app shell, not UI.
`AuthHeader` stays for a different reason: the support version is a genuinely
different, simpler component, not a copy that drifted.

**They need an app service.** `Attachment`, `Attachments`, `PresignedImage`,
`Avatar`, `AvatarWithName`, `UploadFiles` and `UploadAvatar` go through
`@hooks/attachment.hook`, which calls `CommonService` for presigned URLs.
`FileDropZone` needs `errorToast`, which writes to the app's toast store. These could move if the package gained a
provider supplying a presigned-URL resolver and a toast function, which is a
deliberate design decision rather than a mechanical move.

**They are app configuration.** `nav-list.ts` and `LearnerNavigation` are route
tables. They happen to be identical between two apps today, but navigation is a
product decision per app, so sharing them would couple the apps to each other.

`Select`, `DataTable`, `CheckboxSelection` and `RadioSelection` sit just behind
the second group: each needs `Html` or `BlankState` from `components/others`.
`Html` pulls in the math-jax editor, which is 60 teaching-only files. `DataTable`
is now byte-identical in teaching and support (support took the teaching version
with sorting, column filters, skeleton rows and row click); learning still has the
older one. Reconciling `Html` and the learning table is the next step if you want
this cluster shared.

## History

Consolidating this package removed roughly 1,100 lines of duplicated component
code from the three apps. The `orgId` to `org` rename, the enum consolidation and
the shared DTO work are documented separately in `packages/shared`.
