---
description: >
  Work on the workspace packages themselves — @repo/shared, @repo/ui and @repo/eslint-config —
  rather than consuming them: adding an export or a subpath, adding or upgrading a dependency,
  moving code in, and knowing which consumers break. The three packages have deliberately
  different mechanics: shared compiles to CommonJS for the server, ui is consumed as source with
  no build, and eslint-config must stay CommonJS because five of the six flat configs `require` it.
when_to_use: >
  Trigger BEFORE editing any package.json, before adding or upgrading a dependency anywhere in the
  monorepo, before adding a subpath export or a barrel file in packages/*, before moving a
  component or helper from an app into a package, when adding a lint rule, and when creating a new
  workspace package. Also when a change inside a package does not seem to reach a consumer.
argument-hint: '[the package and what is changing]'
---

# Extend a package

Eight workspaces: `apps/{learning,teaching,admin,server}` and
`packages/{shared,ui,eslint-config}`, with pnpm 10.12.1 pinned by `packageManager` and the globs
`apps/*` / `packages/*` in `pnpm-workspace.yaml`.

## Which package

| It is…                                                    | Package                  | Build?                    |
| --------------------------------------------------------- | ------------------------ | ------------------------- |
| an enum, DTO, pure interface — anything the server needs   | `@repo/shared`           | yes: `tsc` → `dist` (CJS) |
| React: a component, hook, context, theme, browser helper   | `@repo/ui`               | no: consumed as source    |
| a lint rule or a rule tier                                 | `@repo/eslint-config`    | no: plain CommonJS        |

`define-data-shape` decides where a *type* goes. This skill is about the package around it.

## must — any package

1. **A package never imports an app.** No `@components/*`, `@stores`, `@services`, no MobX in
   `packages/ui`; no React, Next or `@repo/ui` in `packages/shared`. These are
   `no-restricted-imports` errors, so the lint fails rather than the layering rotting quietly.

2. **A dependency belongs to the workspace that imports it.** A new Radix package goes in
   `packages/ui/package.json`; class-validator lives in `packages/shared`; MobX and Firebase stay
   in the apps. Adding it to an app because that is where you noticed the missing module leaves the
   package depending on a hoisted accident.

3. **React, React-DOM and Next are exact pins in five places.** All three apps declare
   `react@19.0.0-rc-69d4b800-20241021` and `next@15.0.1`, and `packages/ui` mirrors them in
   **both** `peerDependencies` and `devDependencies`. Bump all five together or pnpm resolves two
   Reacts and every hook in a shared component breaks at runtime. The check is one line:

   ```bash
   ls node_modules/.pnpm | grep -E '^react@'   # must print exactly one version
   ```

4. **`pnpm install` after any manifest edit, and commit the lockfile.**
   `pnpm install --frozen-lockfile` must pass — that is what proves the two are in step.

5. **Verify the consumers, not the package.** See `verify-changes`. Changing `packages/shared`
   means all six workspaces; changing `packages/ui` means `pnpm typecheck:ui` **and** at least one
   app.

## must — packages/shared

6. **It has a build, and the server runs the output.** `pnpm build:shared` compiles `src` to
   `dist` as CommonJS. Until it runs, every consumer typechecks against the previous shape and the
   errors you are reading are stale. This is also why the package is pure TypeScript: Node cannot
   `require` a `.ts` file.

7. **A new subpath is three edits, not one:** the `exports` map, the parallel `typesVersions` block,
   and the barrel the entry points at. Miss `typesVersions` and the import resolves at runtime
   while TypeScript claims the module does not exist.

8. **Never re-export the validation DTOs from `dtos/index.ts` or the root barrel.** They carry
   class-validator and class-transformer decorators, so the root barrel would pull the validator
   into every browser bundle. `dtos/index.ts` says so in a comment; keep it true. The boundary
   holds today: the apps import only `@repo/shared` and `@repo/shared/enums`, and none of the three
   built bundles contains class-validator. Server code imports `@repo/shared/validations`.

9. **A wire shape for the apps is a type-only re-export in `contracts/`,** wrapped in `ResponseOf`:

   ```ts
   import type { CourseDto as CourseFields } from '../dtos/validations/course/course.dto';
   export type CourseDto = ResponseOf<CourseFields>;
   ```

   `import type` is what keeps the compiled `contracts/*.js` empty — two lines of module preamble
   and nothing else. A plain `import` there would undo rule 8.

## must — packages/ui

10. **There is no build, which is the thing to internalise.** Each app's `next.config.js` lists
    `transpilePackages: ['@repo/shared', '@repo/ui']`, so the apps compile the package's TypeScript
    themselves. A green `pnpm typecheck:ui` therefore proves very little: JSX and prop errors
    surface in the app's typecheck and build.

11. **React, React-DOM and Next stay in `peerDependencies`** (mirrored in `devDependencies` only so
    the package can typecheck itself). Moving them to `dependencies` gives the package its own copy
    of React — see rule 3.

12. **A new subpath is one line in `exports` plus the barrel it points at.** Nine exist today.
    `./app` is deliberately **not** re-exported from the root: fourteen names exist in both `core`
    and `app` with different APIs.

13. **The layer rules are lint errors, not advice.** Feature code never imports `@repo/ui/ui/*`;
    inside the package, imports are relative and name the defining module — never the folder barrel
    (`from '.'`, `from '..'`) and never the package's own `@repo/ui/*` subpaths.

## must — packages/eslint-config

14. **It stays CommonJS.** All six workspaces are on ESLint 10 with flat configs, and five of them
    `require()` this package — only `packages/ui`'s config is ESM, and it default-imports the CJS
    module, which works. Converting to ESM would break the other five.

15. **Pick the tier deliberately.** `mustRules` and `layerRules` are `error`: a violation is a
    defect. Everything stylistic is `warn` in `shouldRules`. Promoting a rule to `error` means
    fixing every existing violation in the same change, because `pnpm lint` must exit 0.

16. **Keep the tool versions aligned** across every workspace that lints: ESLint `^10.10.0`,
    `@typescript-eslint/*` `^8.70.0`, typescript `^6.0.3`, prettier `^3.9.6`. A split version
    silently changes which rules exist and how code is formatted.

## should

- **Upgrading rather than adding** is the `upgrade-a-dependency` skill: the locked sets, the
  verification ladder, how to read a break, and the current backlog. Scope the install
  (`pnpm --filter @repo/ui update <pkg>`) so one workspace moves at a time. Expect one pre-existing
  peer warning on a fresh resolution — `react-fast-scroll-pdf` in `apps/learning` wants `react@^18`
  and gets the 19 RC. It is known and harmless; do not "fix" it by downgrading React.
- `@types/react` is `^18` across the repo while React is a 19 RC. Also known. Bumping the types
  alone surfaces unrelated errors, so change it as its own piece of work, not in passing.
- `lucide-react` is a `packages/ui` dependency only because nine generated shadcn primitives import
  it. Wrappers and feature code use `@phosphor-icons/react`; leave a generated primitive as it came.
- **Moving code from an app into a package:** follow "Moving an app component in" in
  `packages/ui/README.md`, and do the transitive check — a clean component that imports a coupled
  sibling by relative path cannot move until that sibling does. That single step is what kept
  seventeen shareable components stuck in the apps.
- **A new package:** name it `@repo/<x>`, `"private": true`, let the `packages/*` glob pick it up,
  give it a `tsconfig.json`, a `lint` script and a flat config spreading `@repo/eslint-config`, add
  it to the workspace list in `CLAUDE.md`, then `pnpm install` to link it.
- Keep `packages/ui/README.md` current when you change the layers or the subpaths. It is the only
  place the "what stays in the apps and why" reasoning lives.

## After the change

```bash
pnpm install                 # any manifest edit; commit the lockfile
pnpm build:shared            # only if packages/shared changed — required before any consumer
pnpm typecheck:ui            # only if packages/ui changed
pnpm lint                    # all six lintable workspaces; must exit 0
```

Then typecheck and build each consumer — `verify-changes` has the sequence and the reasoning.
