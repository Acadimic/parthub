---
description: >
  Upgrade a dependency across this monorepo without leaving a half-migrated tree: establish a green
  baseline, move locked version sets together, then walk the verification ladder so each class of
  breakage is caught by the step that can see it. Includes how to read a failure, how to roll back
  cleanly, the codemod discipline that a blind find-and-replace gets wrong, and the repo's current
  upgrade backlog with the hazard each one carries.
when_to_use: >
  Trigger before changing any version in a package.json, before `pnpm update`, when a dependency
  deprecation warning appears, when asked to "update the packages" or take a security fix, and when
  a version bump has already broken the build and you need a route out. Use `extend-a-package` for
  where a dependency belongs and which versions are pinned together.
argument-hint: '[the dependency, or "audit"]'
---

# Upgrade a dependency

Six lintable workspaces, three of them Next apps sharing exact pins, one server, two libraries. An
upgrade is rarely one manifest edit, and `pnpm update -r` across a major is how a whole afternoon
disappears.

## must

1. **Establish the baseline before touching anything.** Record that the tree is green — all six
   typechecks at 0, `pnpm lint` exit 0, all five builds — and that `git status` is clean. Without
   that, the first failure is unattributable and you will be bisecting your own edits.

2. **One dependency, or one locked set, per change and per commit.** A commit that bumps Mongoose
   and Next together cannot be reverted usefully. See the locked sets in must #4.

3. **Read the release notes for the target version first.** Do not migrate from memory of the API —
   these libraries change faster than anyone's recall, and a wrong assumption here costs more than
   the ten minutes of reading. Note the majors you are crossing: 8 → 12 is three sets of breaking
   changes, not one.

4. **Move a locked set together, in the same commit.**
   - `react`, `react-dom`, `@types/react`, `@types/react-dom`, `next` — in all three apps **and**
     `packages/ui`'s `peerDependencies` and `devDependencies`. Then prove there is one copy:
     `ls node_modules/.pnpm | grep -E '^react@'` must print exactly one version.
   - `@nestjs/*` — common, core, platform-fastify, mongoose, config, cli, schematics — plus
     `nestjs-cls` and `nestjs-pino`, which track the Nest major.
   - `mongoose` with `@nestjs/mongoose`.
   - `class-validator`, `class-transformer` and `reflect-metadata`: the decorators, the transformer
     that reads them and the polyfill that stores the metadata are one unit.
   - `eslint` with `@typescript-eslint/*` and `eslint-config-next`.
   - `mobx`, `mobx-react-lite`, `mobx-state-tree`.

5. **`skipLibCheck: true` is set in all six tsconfigs.** Library type breakages are therefore
   invisible until your own code touches them. A green typecheck after an upgrade is necessary and
   nowhere near sufficient — the build and a runtime smoke test are what find the rest.

6. **Never hand-edit `pnpm-lock.yaml`.** To roll back:
   `git checkout -- '**/package.json' pnpm-lock.yaml && pnpm install`. To confirm a landed upgrade
   is internally consistent: `pnpm install --frozen-lockfile`.

7. **Do not leave a half-migrated tree.** Either the upgrade lands green, or it is reverted and the
   reason recorded: pin the version, comment why, and note what blocked it. A repo where
   `pnpm lint` or a build is red is a repo where the next person cannot tell their breakage from
   yours.

## The verification ladder

Each rung catches a class of failure the one above cannot see. Walk it in order and stop at the
first failure — later rungs will only produce noise.

```bash
pnpm install                                     # resolution: peer conflicts, duplicate instances
ls node_modules/.pnpm | grep -E '^react@'        # exactly one React, always
pnpm build:shared                                # if shared or its deps moved
# typecheck each affected workspace — the fastest signal, and it names the API that changed
pnpm lint                                        # renamed or removed lint rules, new defaults
pnpm build:server && pnpm build:teaching         # bundler, plugin and config-schema breaks
cd apps/server && node -e "require('./dist/app.module.js')"   # decorators, DI, import cycles
```

`next build` prerenders, so it executes module-level code — that is the closest thing to a runtime
test this repo has. There is no test suite, so finish with a manual pass over one screen the
dependency actually drives.

## The server needs more than a build

Loading the compiled graph proves the decorators evaluate and the DI wiring resolves. It touches
**no database, no Fastify plugin and no middleware** — `main.ts` registers compression, helmet, the
global pipe, `TransformInterceptor`, `HttpExceptionFilter` and CORS at bootstrap, and none of that
runs until the process listens. So after any server-side upgrade, run it:

```bash
pnpm start:server                     # env-cmd -f .env.development nest start --watch
curl -s localhost:9000/health         # `@Public()`; returns OK only if Mongoose actually connected
curl -s localhost:9000/               # `@Public()`; proves the pipeline serves a response
```

Then, with a real token from one of the apps, exercise the parts an upgrade silently breaks:

1. **One write.** Confirm the change-tracking plugin still stamped `org`, `createdBy` and
   `updatedBy` — a Mongoose major can change which hooks fire for `findOneAndUpdate`, `insertMany`
   and `bulkWrite`, and the plugin is attached to all of them.
2. **One read.** Confirm soft-deleted rows are still filtered.
3. **One 404.** Confirm the error shape is still `{ error: { code, message } }` and that a success
   is still wrapped as `{ data }` — those come from the filter and the interceptor, not from your
   controllers.
4. **One rejected body.** Post an unknown property and confirm it still 400s, which is what proves
   `whitelist` / `forbidNonWhitelisted` survived a `class-validator` bump.

### The decorator-metadata hazard

This is the backend break that a green typecheck will not warn you about. The server compiles with
`experimentalDecorators: true` and `emitDecoratorMetadata: true`, and both NestJS dependency
injection and class-validator read that emitted metadata through `reflect-metadata` at runtime. A
TypeScript major that changes decorator emit therefore breaks DI and request validation **at
runtime while everything still compiles**. That is the reason TypeScript is last in the backlog
below, and the reason its upgrade must end with the smoke run above rather than a build.

### The `dist` trap

`nest-cli.json` sets `deleteOutDir: true`, while the tsconfig is `incremental` with
`tsBuildInfoFile: ./dist/.tsbuildinfo` — the build deletes the directory holding its own
incremental state. That combination has already produced a phantom `Cannot find module
'dist/main'` in this repo. After an upgrade that changes the compiler or the Nest CLI, delete
`dist` and rebuild before believing any error it reports.

## Reading a failure

| What you see                                    | What it usually is                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| Type error in **your** code                     | The real migration work. Fix the call site, do not cast it away.          |
| Type error inside `node_modules`                | A type-version mismatch (`@types/react` against a different React). `skipLibCheck` normally hides these, so one that surfaces is on a path you import. |
| `unmet peer dependency` warning                 | Usually not a breakage. This repo already has one: `react-fast-scroll-pdf` in `apps/learning` wants React 18 and gets 19. |
| A lint rule "does not exist"                    | Renamed, not removed. Check the plugin changelog before deleting the rule. |
| Two copies of a library at runtime, broken hooks | A locked set moved out of step — see must #4.                            |
| A Tailwind class silently stops working         | The palette plugin or the config schema, not your class. See `style-with-tailwind`. |
| Build passes, screen is blank                   | A default export or entry point moved. Check the release notes for renamed exports. |
| Server compiles, then DI or validation fails at runtime | Decorator metadata. See the hazard above — suspect the TypeScript or `reflect-metadata` version, not your module. |
| `Cannot find module 'dist/main'`                | Stale `dist`. Delete it and rebuild; see the `dist` trap above.        |

## Renames and codemods

When an upgrade renames exports, **rename by import specifier and let the compiler find the call
sites.** Do not run a text replacement over the source.

This repo has the scar: renaming the deprecated Phosphor icons (`CaretDown` → `CaretDownIcon`) with
a blind find-and-replace also rewrote user-visible strings, turning "Copy Link" into
"CopyIcon Link" in two files. The safe order is:

1. Change the import list only.
2. Let `tsc` list every call site, and fix those.
3. Before committing, grep the diff for the old token inside JSX text and string literals —
   the compiler cannot see those.

## The current backlog

Taken on 2026-09-08 from `pnpm outdated -r`. **Re-run it rather than trusting this list**, and note
that "latest" moves.

| Upgrade                                     | Hazard                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| Radix, `axios`, `@typescript-eslint`, `@firebase/auth` (patch/minor) | Low. Do these first, in one commit, to shrink the noise. |
| `react` 19.0.0-rc → 19.2.x + `@types/react` 18 → 19 | Removes both the RC pin and the types mismatch. One commit, five manifests, then check the instance count. |
| `class-validator` 0.14 → 0.15 with `class-transformer` | Every request body validates through it. Post an unknown property and confirm it still 400s, which is what `whitelist` / `forbidNonWhitelisted` guarantee. |
| `mongoose` 8 → 9 with `@nestjs/mongoose`     | Query and `lean` typings, and the two global plugins hook `save`, `update*`, `replace*`, `insertMany` and `bulkWrite`. Do a real write and confirm the ownership fields were stamped. |
| `@nestjs/*` 10 → 12, with `nestjs-cls` and `nestjs-pino` | Two majors. Fastify adapter, guard and interceptor signatures, `ParseArrayPipe` options, and the CLS middleware the request context depends on. |
| `mobx` 7 / `mobx-state-tree` 8 / `mobx-react-lite` 5 | The stores are the apps' spine: `flow`, `observer`, snapshot types. Expect real work. |
| `next` 15 → 16 with `eslint-config-next` 16 | Pages Router behaviour and the `next lint` entry point the apps' lint scripts use. |
| `eslint` 8/9 → 10                           | The three apps are still on `.eslintrc.js`; this is also the flat-config migration. `@repo/eslint-config` must keep serving both until they land together. |
| `tailwindcss` 3 → 4                         | Config moves into CSS. **Check `tw-colors` compatibility before starting** — the whole palette comes from that plugin. |
| `typescript` 5 → 7                          | Last, and the riskiest for the server: decorator emit feeds NestJS DI and class-validator at runtime. Finish with the smoke run, not a build. |
| `@fullcalendar/*` 6 → 7                     | Teaching only, and isolated to the calendar module. Safe to do out of order. |

## Worth doing before any UI upgrade

Each app declares 23–24 UI dependencies it does not import — the Radix packages, `cmdk`,
`lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `randomcolor`,
`bson-objectid` — left over from before the primitives moved into `packages/ui`. They are why
`pnpm outdated` lists every Radix package as a dependency of all four workspaces, and why a Radix
bump currently looks like a four-manifest change instead of a one-manifest change. Removing them
(`bson-objectid` stays in `apps/server` and `packages/ui`, which do import it) makes every future
UI upgrade smaller. Verify with a build, since a genuinely-used package would fail to resolve.
