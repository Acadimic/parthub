---
description: >
  Decide where a type, interface, enum or model belongs in this monorepo, and shape it the way the
  rest of the codebase does. There are five places a shape can live — packages/shared, @repo/ui/types,
  an app's src/interfaces, a store entity type, a Mongoose schema — and putting one in the wrong place is
  how the same enum ends up declared three times with drifted values. Use this before declaring any
  new data shape.
when_to_use: >
  Trigger BEFORE declaring a new interface, type alias, enum, DTO, store entity or Mongoose schema, and
  before adding a field to an existing one. Specifically: (1) "add a field to X"; (2) a new entity;
  (3) a new enum or status value; (4) you are about to write `Record<string, unknown>` or reach for
  a cast because a shape is not declared; (5) a client field the server does not know about.
argument-hint: '[the shape you need]'
---

# Define a data shape

Read `.claude/plans/DATA_CONTRACTS.md` for the full argument. This is the decision procedure.

## Where it goes

Work down this list and stop at the first match.

1. **The server validates it, or both sides send it** → `packages/shared`.
   Enums in `src/enums`, wire contracts in `src/dtos/validations/<entity>/`, pure interfaces in
   `src/interfaces`. This is a real build step: run `pnpm build:shared` before a dependent
   workspace can see the change, because the server runs compiled JavaScript.
2. **It needs React** (a `ReactNode` label, a component prop) → `packages/ui/src/types`.
   `ISelectItem`, `IMenuItem<T>`, `IColumnData<T>`, `IStep`, `IColor` live here for exactly that
   reason.
3. **Only one app has it, and it is not sent anywhere** → that app's `src/interfaces/<name>.interface.ts`,
   re-exported from `src/interfaces/index.ts`. That barrel deliberately mixes shared re-exports with
   app-only types.
4. **It is the client's stateful copy of an entity** → a type alias in the store that owns it,
   built from the entity's DTO: `export type IBatch = ClientEntity<BatchDto>;`. There are no model
   files — the DTO is the single declaration, and `ClientEntity` adds what only the client needs.
5. **It is how the entity is stored** → the Mongoose schema in the server module, extending
   `BaseSchema`.

## must

1. **An enum value is canonical in `packages/shared`.** Never declare a second copy in an app or on
   the server. An app's `@enums` re-exports the shared ones and adds only app-only enums.
2. **One DTO per entity**, extending `BaseOwnedDto`, serving both request and response. No separate
   `Upsert*` class. `_id` is `@IsNotEmpty() @IsMongoId()`.
3. **`packages/shared` imports no React, no Next and no `@repo/ui`.** ESLint fails the build on it.
   It is compiled to CommonJS for the server.
4. **`_deleted` is the delete mechanism**, on `BaseOwnedDto` and `BaseDeleteModel`. Nothing is ever
   hard-deleted, and every read filters `{ _deleted: { $ne: true } }`.
5. **Client-only fields are declared as such.** A field the UI adds — `isNew`, a per-row
   `reactionsCount`, a per-row loaded flag — must be listed in `CLIENT_ONLY_KEYS` in
   `packages/ui/src/lib/payload.ts`, or the next write that includes it is rejected whole by
   `forbidNonWhitelisted`. If the field should actually persist, add it to the schema and the DTO
   and remove it from that list instead. **A store's fetch state is not one of these:** it belongs
   to `createRequestSlice`, not to a row.
6. **No `any`.** Declare the shape, or take `unknown` and narrow. This is an ESLint error in all six
   workspaces.

## should

- Build a store entity from its DTO rather than restating the fields. `ClientEntity<T>` leaves the
  server-assigned ownership fields optional — a row the user is still creating has no `org` or
  timestamps yet — and adds `isNew`. Where the client has always relied on a field the DTO marks
  optional, name it: `ClientEntityWith<MeetDto, 'startTime' | 'endTime' | ...>`. Remember that is an
  assumption the Mongoose schema may not enforce, which is why the fields are listed explicitly.
- Key entities in a store by `_id` in a `Record<string, T>`, and expose arrays through a getter
  (`getBatches()`), not by handing out the map.
- Put the client-only additions in an intersection after the DTO, so a reader sees exactly which
  fields are ours: `ClientEntity<UserDto> & { photoUrl?: string | null }`.
- An entity the API serves but has no DTO for goes in
  `packages/shared/src/interfaces/entity.interface.ts` as `I<Entity>Fields`, written from the
  server's Mongoose schema. Five live there today; each names the schema it mirrors, and
  `ICourseModuleFields` records that it mirrors none.
- Prefer `interface` for a plain object shape — an ESLint "should" rule — and keep `type` for
  unions, intersections and mapped types, which cannot be interfaces.
- Give a generic row type a default of `unknown`, not `any`, and make the consumer generic. That is
  why `IColumnData<T = unknown>` works and `DataTable` is `<T extends object>`.
- Name it for what it is: `I` prefix on an interface, PascalCase on an enum and its members'
  `SCREAMING_SNAKE` values, `<Entity>Dto` on a contract, `<entity>.interface.ts` /
  `<entity>.model.ts` / `<entity>.dto.ts` on the file.

## Keeping the two sides honest

The drift guard this section used to describe is gone, and so is the problem it solved. A client
entity is now *derived* from its DTO (`ClientEntity<CourseDto>`), so the two cannot disagree:
adding a field to the DTO adds it to the store, and the compiler names every call site that has to
change. If you find yourself writing a structural copy of a DTO by hand, that is exactly what the
guard used to catch — derive it instead.

## After changing packages/shared

```bash
pnpm build:shared        # required; the server and apps read the compiled output
pnpm typecheck:ui        # the package is consumed as source, so breakage surfaces here
```

Then typecheck every workspace that imports the shape — see the `verify-changes` skill.

Adding a **subpath** rather than a type, or touching a package's manifest, dependencies or barrels,
is the `extend-a-package` skill.
