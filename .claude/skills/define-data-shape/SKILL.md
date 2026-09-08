---
description: >
  Decide where a type, interface, enum or model belongs in this monorepo, and shape it the way the
  rest of the codebase does. There are five places a shape can live — packages/shared, @repo/ui/types,
  an app's src/interfaces, an MST model, a Mongoose schema — and putting one in the wrong place is
  how the same enum ends up declared three times with drifted values. Use this before declaring any
  new data shape.
when_to_use: >
  Trigger BEFORE declaring a new interface, type alias, enum, DTO, MST model or Mongoose schema, and
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
4. **It is the client's stateful copy of an entity** → an MST model in the app's
   `src/stores/models/<entity>.model.ts`.
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
5. **Client-only fields are declared as such.** A field the UI adds — `isNew`, an `isLoading*` or
   `isLoaded*` flag, a derived count — must be listed in `CLIENT_ONLY_KEYS` in
   `packages/ui/src/lib/payload.ts`, or the next write that includes it is rejected whole by
   `forbidNonWhitelisted`. If the field should actually persist, add it to the schema and the DTO
   and remove it from that list instead.
6. **No `any`.** Declare the shape, or take `unknown` and narrow. This is an ESLint error in all six
   workspaces.

## should

- Compose an MST model from the base models rather than repeating their fields:
  `t.compose(BaseTimestampModel, BaseOrgOwnerModel, t.model('Batch', { ... }))`. They supply
  `_deleted`, `createdAt`, `updatedAt`, `org`, `createdBy`, `updatedBy`.
- Key entities in a store by `_id` in a `t.map`, and expose arrays through a view
  (`get batches()`), not by handing out the map.
- Separate the wire shape from the view state inside a model: declare the server fields, then the
  UI-only ones under a comment, so a reader can see when the two have diverged.
- Export the instance type next to the model: `export type IBatch = Instance<typeof Batch>;`
  (or `export interface IUser extends Instance<typeof User> {}` where the name is used as an
  interface elsewhere).
- Prefer `interface` for a plain object shape — an ESLint "should" rule — and keep `type` for
  unions, intersections and mapped types, which cannot be interfaces.
- Give a generic row type a default of `unknown`, not `any`, and make the consumer generic. That is
  why `IColumnData<T = unknown>` works and `DataTable` is `<T extends object>`.
- Name it for what it is: `I` prefix on an interface, PascalCase on an enum and its members'
  `SCREAMING_SNAKE` values, `<Entity>Dto` on a contract, `<entity>.interface.ts` /
  `<entity>.model.ts` / `<entity>.dto.ts` on the file.

## Keeping the two sides honest

When a client model and a server DTO describe the same entity, add the drift guard from
`DATA_CONTRACTS.md` so a mismatch is a compile error rather than a 400 at run time:

```ts
const _assertCourseWire: (dto: CourseDto) => ICourseSnapshotIn = (dto) => dto;
```

## After changing packages/shared

```bash
pnpm build:shared        # required; the server and apps read the compiled output
pnpm typecheck:ui        # the package is consumed as source, so breakage surfaces here
```

Then typecheck every workspace that imports the shape — see the `verify-changes` skill.
