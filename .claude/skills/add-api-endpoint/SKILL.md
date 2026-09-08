---
description: >
  Add or change a server endpoint in apps/server, together with the shared DTO the apps type
  against. Covers the whole vertical: the field list in packages/shared, the controller with its
  access decorators, the org-scoped service query, the mapper, and the client service call. Every
  route in this codebase is declarative about who may call it, and every write is scoped to one
  organization; this skill is how you keep that true.
when_to_use: >
  Trigger BEFORE adding or editing anything under apps/server/src/modules, before adding a method
  to an app's src/services, and before adding or changing a DTO in packages/shared/src/dtos.
  Specifically: (1) a request for a new endpoint, route or "API"; (2) a new field on an entity that
  has to reach the database; (3) changing who may call an existing route; (4) a client screen that
  needs data no endpoint returns yet.
argument-hint: '[what the endpoint does]'
---

# Add an API endpoint

Read `.claude/plans/API_CONVENTIONS.md` for the reasoning and the worked examples, and
`.claude/plans/DATA_CONTRACTS.md` for how the shared types are shaped. This skill is the
checklist; those two are the argument.

## must

A violation here is a defect, not a style preference. Most of them are silent — they compile,
they pass review, and they leak data across organizations at runtime.

1. **Every route carries `@Permissions()`.** A route without it is not callable at all, because
   `AccessGuard` fails closed. Write `@Permissions()` with no arguments when any member of the
   organization may call it, so the intent is visible rather than absent.
2. **Every write filters by `org`.** Put it in the filter, not only in the update:
   `findOneAndUpdate({ _id, org }, ...)`. An upsert with `_id` alone will happily reach into
   another organization's document.
3. **Never take `org`, `createdBy`, `updatedBy` or the timestamps from the request body.**
   `change-tracking.plugin.ts` stamps them from the CLS request context on create, update, replace
   and bulk write. Setting them in `$setOnInsert` is redundant and lets a client claim ownership.
   To write into a different org deliberately (an invite, say), use
   `RequestContextService.withOrg()`.
4. **Reads exclude soft-deleted rows**: `{ _deleted: { $ne: true } }`. A client deletes by sending
   `_deleted: true` on the upsert; nothing is ever removed.
5. **One DTO per entity, extending `BaseOwnedDto`**, serving both the request body and the
   response. Do not add a second `Upsert*` class. `_id` is always
   `@IsNotEmpty() @IsMongoId()` — the client generates it, so a write is idempotent.
6. **A single-document lookup returns `| null`** and the caller handles the miss. A controller
   throws `NotFoundException`; a service that cannot continue throws too. The tsconfig has
   `strict: true`, so the compiler will ask.
7. **Every body is a DTO class, and an array body also needs `ParseArrayPipe`.** The global
   `ValidationPipe` only validates a body whose metatype is a class: it skips `Array` and `Object`
   entirely. So `@Body() payloads: XDto[]` and `@Body() body: { userId: string }` both accept
   anything at all — no whitelist, no `@IsMongoId`. Write an inline shape as a DTO class, and
   declare an array body as
   `@Body(new ParseArrayPipe({ items: XDto, whitelist: true, forbidNonWhitelisted: true }))`.
   Every handler in the codebase now does one or the other; keep it that way.
8. **Enum values are canonical in `packages/shared`.** Add the value there and rebuild
   (`pnpm build:shared`); never declare a second copy in an app.

## should

- Give the route a `@Subdomains(...)` list when only some apps may call it. Omit it when all may.
- Name the route for the operation, not the caller: `batch/upsert`, `batch/all`,
  `course/:id`. Read `## Naming` in `API_CONVENTIONS.md` before inventing a shape.
- Write a mapper (`x.mapper.ts`) that lists every response field explicitly. That is the one place
  that knows about `ObjectId` and `Date`, and listing fields keeps `__v` and anything added later
  out of the response.
- Return the document, not an envelope. `callAuthApi` is typed `Promise<SuccessResponse<T>>` and
  callers read `result.data`, so wrapping the payload again on the server yields
  `{ data: { data } }`.
- Keep the service free of HTTP: it takes `org: Types.ObjectId` and a DTO, and throws domain
  exceptions. The controller owns the request context and the status code.
- On the client, just post what you have. Each app's `http.service.ts` runs every body and query
  object through `toPayload`, so UI-only keys such as `isNew` never reach the server and no service
  method has to remember.

## The shape of a slice

```ts
// packages/shared/src/dtos/validations/batch/batch.dto.ts — the single field list
export class BatchDto extends BaseOwnedDto {
  @IsNotEmpty() @IsMongoId() _id: string;
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsMongoId() standard?: string;
  @IsNotEmpty() @IsNumber() year: number;
}

// apps/server/src/modules/batch/batch.controller.ts — who may call it, and in which app
@Post('upsert')
@Subdomains(Subdomain.TEACH)
@Permissions(PermissionItem.MANAGE_BATCH)
async upsertBatch(@Body() payload: BatchDto) {
  return this.batchService.upsert(this.requestContextService.getOrgId(), payload);
}

// apps/server/src/modules/batch/batch.service.ts — org in the filter
async upsert(org: Types.ObjectId, payload: BatchDto): Promise<BatchDocument> {
  const { _id } = payload;
  return this.batchModel
    .findOneAndUpdate({ _id, org }, { ...payload }, { new: true, upsert: true, runValidators: true })
    .lean<BatchDocument>();
}

// apps/<app>/src/services/batch.service.ts — http.service strips the UI-only keys for you
upsertBatch = async (payload: IBatchUpsert) => callAuthApi(url, API.POST, payload);
```

## Steps

1. **Decide where the type lives** — run the `define-data-shape` skill. A field the server
   validates belongs in `packages/shared`.
2. Add or extend the entity's DTO. If you add a shared enum value, `pnpm build:shared`.
3. Add the service method (org-scoped, soft-delete aware, `| null` where it can miss).
4. Add the controller handler with `@Permissions` and, if applicable, `@Subdomains`.
5. Extend the mapper if the response gained a field.
6. Add the client service method, wrapped in `toPayload` for every write.
7. Verify with the `verify-changes` skill. The server and shared each have their own typecheck, and
   `pnpm build:shared` must run before the apps can see a new shared type.

## Related skills

- `query-with-mongoose` — the query filters that make rules 2 to 4 above true, plus indexes,
  `lean`, and which operations the plugins hook.
- `add-server-module` — the module, schema and wiring around the route, and what the request
  pipeline already does for you.
- `define-data-shape` — where the DTO and any new enum value belong.
- `verify-changes` — `pnpm build:shared` first, then the workspaces that consume it.

## Public and private routes

- `@Public()` exempts a route from authentication entirely. Use it only for sign-up, sign-in and
  webhooks.
- `@Private()` marks a route callable only with the internal shared secret, compared with
  `timingSafeEqual`. Use it for server-to-server calls, never for anything a browser reaches.
- Neither decorator removes the need for `@Permissions()` on an authenticated route.
