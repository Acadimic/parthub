# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Skills

`.claude/skills/` holds the conventions as skills, so the rule arrives with the task rather than
having to be remembered. Each one is split into **must** (a violation is a defect) and **should**
(convention), mirroring the two ESLint tiers. Invoke one with `/<name>`.

| Skill                   | Use it before                                                        |
| ----------------------- | -------------------------------------------------------------------- |
| `use-ui-component`      | writing any UI in a feature — decides what already exists            |
| `style-with-tailwind`   | writing a className, picking a colour, or editing a theme or config  |
| `build-a-form`          | any form, edit dialog or upsert modal in an app                      |
| `create-core-component` | adding a wrapper in `packages/ui/src/core/`, or a shadcn primitive   |
| `add-app-screen`        | touching an app's `pages/`, `modules/`, `layouts/` or `stores/`      |
| `add-api-endpoint`      | adding or changing a route in an existing server module              |
| `add-server-module`     | creating a server module, a Mongoose schema, or editing `app.module` |
| `query-with-mongoose`   | any query, schema or index in `apps/server`                          |
| `define-data-shape`     | declaring any interface, enum, DTO, MST model or Mongoose schema     |
| `write-comments`        | writing comments, docblocks, or any suppression that needs a reason  |
| `extend-a-package`      | editing a `packages/*` manifest, export, or adding a dependency      |
| `upgrade-a-dependency`  | bumping any version, or recovering from a breaking upgrade           |
| `verify-changes`        | reporting a change complete, and before every commit                 |

Longer-form reasoning lives in `.claude/plans/API_CONVENTIONS.md` and
`.claude/plans/DATA_CONTRACTS.md`; the skills reference them rather than repeating them.

## Build & Development Commands

```bash
# Node 24.20.0 LTS is pinned in the root package.json via Volta; pnpm 10.12.1 via packageManager.
# With Volta installed, `node` in this repo is the pinned version automatically.
pnpm install

# Development
pnpm start:learning      # Next.js dev server (port 3000)
pnpm start:teaching      # Next.js dev server (port 3001)
pnpm start:admin         # Next.js dev server (port 3002)
pnpm start:server        # NestJS dev server (uses .env.development via env-cmd)

# Build
pnpm build:shared        # Build shared package (run first if shared types changed)
pnpm build:learning      # Build Next.js app
pnpm build:teaching      # Build Next.js teaching app
pnpm build:admin         # Build Next.js admin app
pnpm build:server        # Build NestJS app (nest build)
pnpm typecheck:ui        # Typecheck the shared React package (packages/ui, no build step)

# Lint & Format
pnpm lint                # ESLint across all six lintable workspaces; must exit 0
pnpm --filter @repo/server lint:fix   # every workspace also has lint:fix; `lint` never rewrites files
pnpm format              # Prettier across all workspaces

# Single workspace commands
pnpm --filter @repo/learning <script>
pnpm --filter @repo/teaching <script>
pnpm --filter @repo/admin <script>
pnpm --filter @repo/server <script>
pnpm --filter @repo/shared <script>
pnpm --filter @repo/ui <script>
```

## Architecture

**Monorepo** with pnpm workspaces: `apps/learning`, `apps/teaching`, `apps/admin`, `apps/server`, `packages/shared`, `packages/ui`, `packages/eslint-config` (the shared lint rules — see "Code Style").

### Where shared code lives

- **`packages/shared` (`@repo/shared`)** — pure TypeScript, no React: enums, DTOs, interfaces, constants. Consumed by the server and all three apps. Compiled with `tsc`; run `pnpm build:shared` after changes. Subpath exports: `@repo/shared`, `@repo/shared/enums`, `@repo/shared/interfaces`, `@repo/shared/validations`, `@repo/shared/contracts`. The validation DTOs are deliberately kept out of the root barrel so class-validator never reaches a browser bundle; `contracts/` re-exports their shapes as types only.
- **`packages/ui` (`@repo/ui`)** — every shared React component, consumed as TS source via `transpilePackages` (no build): `ui/` shadcn primitives, `core/` wrappers over them, `app/` components composed from `core/`, plus `contexts/`, `hooks/`, `lib/` (cn, date-time, pure and browser helpers), `themes/` (light/dark used by every app's `tailwind.config.js`) and `types/` (React-aware item types such as `ISelectItem`, `IMenuItem`, `IColumnData`). Subpaths: `.`, `./core`, `./app`, `./ui/*`, `./contexts`, `./hooks`, `./lib`, `./themes`, `./types`. **`./app` is deliberately not in the root barrel**: fourteen names exist in both `core` and `app` with different APIs. See `packages/ui/README.md` for the layer rules and for which components stay in the apps and why.
- **Components are imported straight from the package.** Feature code writes `from '@repo/ui/app'` or `from '@repo/ui/core'`; there are no pass-through component barrels. An app keeps an `index.ts` under `src/components` only where that folder still holds its own components, and it exports those alone.
- **Non-component barrels remain**, because they mix shared and app-only values: `src/enums/index.ts` re-exports `@repo/shared/enums` plus app-only enums; `src/interfaces/index.ts` re-exports shared pure types and `@repo/ui/types` plus app-only interfaces; `src/themes`, `src/hooks/dimensions.hook.ts` and `src/utils/helpers/index.ts` re-export from `@repo/ui`. App `src/utils/helpers/util.ts` holds only helpers that depend on app stores/services.
- **Enum values are canonical in `packages/shared`** (they match what the server validates). App code that needs a new value adds it there, never in a local copy. Tailwind `content` in each app includes `../../packages/ui/src/**`.

### Learning (`apps/learning`) — Next.js 15 Pages Router

- **State management:** MobX State Tree. Root store in `src/stores/root.store.ts` with sub-stores (user, course, material, selector, toast). Access via `useStores()` hook. Async actions use MST `flow(function*(...) { ... })`.
- **Layouts:** Pages declare their layout via `Component.layout = Layout.AUTH | Layout.SIDEBAR | ...`. Layout components live in `src/layouts/`.
- **Component layers:** Three-layer system enforced by convention, implemented in `packages/ui`:
  - `packages/ui/src/ui/` — Raw shadcn primitives. **Never import these in feature code.**
  - `packages/ui/src/core/` — Wrappers adding label, error, consistent API. Feature code (`modules/`, `layouts/`, `pages/`) imports them from `@repo/ui/core`. Use the `/create-core-component` skill to create new wrappers.
  - `packages/ui/src/app/` — Components composed from `core/` (SplitButton, DateInput, Carousel, Menu, ...). Feature code imports them from `@repo/ui/app`.
  - **Before writing any UI in a feature, use the `/use-ui-component` skill.** It decides whether an existing app component or core wrapper already covers the need, and if not, has you create the core wrapper first via `/create-core-component` and compose from it. Never hand-roll a shared control or import a raw primitive.
- **Auth:** Firebase Authentication (email/password + Google/Microsoft OAuth). Token management and refresh in `src/utils/firebase/`.
- **HTTP:** Axios with separate auth/unauth callers in `src/services/http.service.ts`. Request interceptor adds Bearer token + permission headers.
- **Styling:** TailwindCSS 3 + MUI 6 + Emotion CSS-in-JS. Light/dark theme via `tw-colors` plugin and `ColorModeContext`.
- **Icons:** Phosphor Icons (`@phosphor-icons/react`).

### Teaching (`apps/teaching`) — Next.js 15 Pages Router

- **Purpose:** Teacher-facing app for managing courses, study materials, test papers, students, and sessions.
- **State management:** MobX State Tree (same pattern as Learning).
- **Component layers:** Same three-layer system as Learning, imported directly from `@repo/ui/core` and `@repo/ui/app`.
- **Styling:** TailwindCSS 3 + shadcn/ui + tw-colors. No MUI dependency.
- **Icons:** Phosphor Icons (`@phosphor-icons/react`).
- **Auth:** Firebase Authentication (same as Learning).

### Admin (`apps/admin`) — Next.js 15 Pages Router

- **Purpose:** Admin app for managing standards, subjects, and test papers across the platform.
- **State management:** MobX State Tree. Root store with sub-stores (standard, course, selector). Access via `useStores()` hook.
- **Component layers:** Same three-layer system, imported directly from `@repo/ui/core` and `@repo/ui/app`.
- **Styling:** TailwindCSS 3 + shadcn/ui + tw-colors. No MUI dependency.
- **Icons:** Phosphor Icons (`@phosphor-icons/react`).
- **Auth:** Firebase Authentication (same as Learning/Teaching).
- **Pages:** Home, Standards, Subjects, Test Papers, Profile, Sign In.

### Server (`apps/server`) — NestJS 12 + Fastify 5

- **Module structure:** One NestJS module per domain (Auth, User, Firebase, Org, Subject, Course, Material, Chapter, TestPaper, Question). Each has controller → service → Mongoose schema.
- **Database:** MongoDB via Mongoose 9. Base schema in `src/database/base.schema.ts`, and two global
  plugins attached to the connection (change tracking, activity logging). See the
  `query-with-mongoose` skill — Mongoose 9 pre-middleware is async, with no `next()`.
- **Auth:** Firebase Admin SDK validates JWTs via `passport-firebase-jwt`. Global `FirebaseAuthGuard` applied via `APP_GUARD`. Use `@Public()` decorator to exempt endpoints.
- **HTTP:** Fastify adapter with Brotli compression and Helmet. Global `ValidationPipe` with whitelist/transform.
- **Logging:** nestjs-pino with pino-pretty in dev. Authorization headers redacted.
- **Config:** `@nestjs/config` with typed `AppConfigService`.

### Shared (`packages/shared`)

Enums, DTOs, and pure interfaces consumed by the server and all apps. Compiled with `tsc` to CommonJS. **Rebuild after changes** (`pnpm build:shared`) before dependent packages can see updates.

### UI (`packages/ui`)

Shared React layer for the apps (see "Where shared code lives"). No build step; `pnpm typecheck:ui` typechecks it. Internal imports are relative (never app path aliases). `peerDependencies` pin the same React/Next versions the apps use so a single React instance is bundled.

## Toolchain

Pinned, and verified together as of 2026-09-08. Runtime versions come from the root
`package.json` (`volta.node`, `packageManager`).

|            |                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Node       | **24.20.0 LTS**, pinned via Volta                                                                                  |
| pnpm       | 10.12.1 via `packageManager`                                                                                       |
| TypeScript | **6.0.3** everywhere                                                                                               |
| ESLint     | **10.10.0** everywhere, flat config only                                                                           |
| Server     | NestJS **12.0.1** on Fastify **5.12.1**, Mongoose **9.9.5**, firebase-admin **14.3.0**, class-validator **0.15.1** |
| Apps       | Next.js 15.0.1, React 19 RC, MobX State Tree 6, TailwindCSS 3                                                      |

Three dependencies are deliberately held back, each on someone else's release:

- **`fastify` stays pinned exactly at 5.12.1**, because `@nestjs/platform-fastify@12.0.1` depends on
  that exact version. A caret resolves a different patch and the plugin types stop matching the
  adapter's — `app.register(compression)` fails to typecheck.
- **`@types/node` stays on 24.x** to match the Node 24 runtime. Types ahead of the runtime describe
  APIs that are not there.
- **TypeScript stays on 6**, because `@typescript-eslint@8.70` is the newest release and peers
  `typescript <6.1.0`. TypeScript 7 would break linting in all six workspaces.

The frontend has its own pending majors (React 19 stable, Next 16, MobX 7, Tailwind 4). Read the
`upgrade-a-dependency` skill before touching any version.

## Path Aliases

**Learning** (`apps/learning/tsconfig.json`):
`@pages/*`, `@components/*`, `@modules/*`, `@enums`, `@utils/*`, `@interfaces`, `@services`, `@stores`, `@layouts`, `@themes`, `@styles/*`, `@hooks/*`

**Teaching** (`apps/teaching/tsconfig.json`):
`@pages/*`, `@components/*`, `@modules/*`, `@enums`, `@utils/*`, `@interfaces`, `@services`, `@stores`, `@layouts`, `@themes`, `@styles/*`, `@hooks/*`

**Admin** (`apps/admin/tsconfig.json`):
`@pages/*`, `@components/*`, `@modules/*`, `@enums`, `@utils/*`, `@interfaces`, `@services`, `@stores`, `@layouts`, `@themes`, `@styles/*`, `@hooks/*`

**Server** (`apps/server/tsconfig.json`):
`@modules/*`, `@config`, `@strategies`, `@decorators`, `@guards`, `@interfaces`, `@enums`, `@utils`, `@base-schemas`, `@dtos`, `@constants`

## Code Style

- Prettier: 120 char width, single quotes, trailing commas, 2-space indent, LF line endings
- **ESLint 10 with flat config in all six workspaces** — every one has its own `eslint.config.js`;
  there is no `.eslintrc.js` left, because ESLint 10 does not read that format at all.
- The three apps take Next's rules from `@next/eslint-plugin-next` directly, not from
  `eslint-config-next` (which peers `eslint ^7 || ^8 || ^9` and would cap the repo below 10).
  `next lint` is not used; every workspace lints with plain `eslint .`.
- `eslint-plugin-react` is deliberately absent: its latest release still caps at `eslint ^9.7`,
  and no rule from it was enabled. React checks come from `@next/eslint-plugin-next`.
- **The rules themselves live in one place: `packages/eslint-config/index.js`** (`@repo/eslint-config`).
  All six workspaces spread the same `mustRules`, `shouldRules` and their own `layerRules` entry, so
  a rule change happens once. It is CommonJS because both ESLint generations consume it.
- `pnpm lint` reports; `pnpm --filter <workspace> lint:fix` fixes. The lint script never rewrites files.

### Two tiers of rule

**must (`error`) — a violation is a defect, and `pnpm lint` fails.**

- `no-explicit-any`, everywhere. See "Typing rules" below.
- `no-restricted-imports`, which makes the package layering machine-checked. Each of these has zero
  violations, and the rule is what keeps it that way:
  - an app may not import `@repo/ui/ui/*` (a raw shadcn primitive) or climb `../../../`;
  - `packages/ui` may not import an app alias, `mobx*`, its own `@repo/ui` subpaths, or the barrel
    above a module (`from '..'`);
  - `packages/shared` may not import React, Next or `@repo/ui`;
  - the server may not import React or `@repo/ui`.

  The message on each one names the fix, so a failure tells you what to do instead.

**should (`warn`) — conventions, advisory.** Twenty-four rules covering: say when an import is a
type (`consistent-type-imports`, inline style), one shape-declaration style (`interface`), no
`!` non-null assertions, `??` over `||` for nullable objects, no unused bindings, no `console.log`,
plain control flow (`eqeqeq`, no nested ternary, no param reassign, no `else` after `return`), and
ceilings that say "extract something" rather than "this is wrong": `max-params` 4, `max-depth` 4,
`complexity` 15, `max-nested-callbacks` 3, `max-lines` 500.

Warnings do not fail the build, so treat them as a nudge on code you are already touching. The
backlog when the tier was introduced was 341, and every autofixable one had already been applied:
teaching 173, learning 93, ui 34, admin 28, server 13, shared 0. The bulk is 96 unused bindings
(the rule had been switched off in the apps), 69 `console.log` calls and 52 nested ternaries. If you
add a warning to a file you are editing, fix it before you finish.

### Typing rules

- **`any` is banned.** `@typescript-eslint/no-explicit-any` is `error` in all six workspaces. Use
  `unknown` and narrow, or declare the shape. The one allowed exception is a generic constraint
  such as `debounce<T extends (...args: any[]) => void>`, where `unknown[]` would reject every
  concrete callback; it carries an inline disable and a comment saying why.
- **No inline suppressions of that rule** without a comment giving the reason.
- **Every tsconfig is strict**, the server included: it sets `strict: true` explicitly, with
  `strictBindCallApply` and `strictPropertyInitialization` the two deliberate exceptions — Mongoose
  schema classes and Nest DTOs declare `@Prop() name: string` with no initializer because the value
  arrives at runtime. A single-document Mongoose lookup therefore returns
  `Promise<XDocument | null>`, and the caller handles the miss (a controller throws
  `NotFoundException`).
- Annotation style is left to the author: `explicit-function-return-type` is off, because
  `noImplicitAny` already closes the real gap and inferred returns are 900+ sites.
- Shared row types come from `@repo/ui/types`. `IColumnData<T>` and `IMenuItem<T>` default to
  `unknown`, so a table declares its row type (`IColumnData<IBatch>[]`) and `DataTable` is generic
  over it. `IMenuItem.onClick` receives the row optionally, so a handler that needs it guards:
  `onClick: (row) => row && edit(row)`.
