---
description: >
  Write Mongoose queries and schemas the way this server does: every org-owned collection filtered
  by org, every read excluding soft-deleted rows, `.lean<T>()` on reads, and only the operations the
  global plugins hook — anything else writes documents with no ownership fields and no audit trail.
  Also covers indexes, why populate is avoided, and what schema evolution looks like with no
  migration tool.
when_to_use: >
  Trigger before writing or editing any query in apps/server (find, findOne, findOneAndUpdate,
  updateMany, bulkWrite, aggregate), before adding or changing a Mongoose schema or index, when a
  query returns a document that should not be visible, when a write lands without org or createdBy,
  and before adding populate, a transaction or an aggregation.
argument-hint: '[the query or collection]'
---

# Query with Mongoose

Mongoose 9 on MongoDB, one model per module, thirty schemas all extending `BaseSchema`. The
tenancy and audit guarantees live in the query filters and two global plugins, not in a framework —
which is why the filter is the thing to get right.

## must

1. **Every query on an org-owned collection filters by `org` — reads as well as writes.** A lookup
   by `_id` is not exempt: `{ _id, org }`, never `{ _id }`. An id is not a secret, and without the
   org clause knowing one is enough to read or delete another organization's row.

   Two documented exceptions, and only these:

   - **Platform collections** are deliberately global: `Standard`, `Subject`,
     `StandardSubjectMapping` and `Org`. The support app manages them for the whole platform, so
     their queries carry no org clause. Their writes are gated with
     `@Subdomains(Subdomain.SUPPORT)` instead.
   - **Caller-scoped collections** filter by the caller's own id rather than the org:
     `Bookmark`, `Reaction`, `Follower`, and "my meets". That is narrower than org and therefore
     fine — **provided the id comes from `RequestContextService.getUserId()`**, never from a
     parameter or the body. A user id taken from the request is the same defect as a missing org.

2. **Every read excludes soft-deleted rows:** `_deleted: { $ne: true }`. Not `_deleted: false` —
   documents written before the field existed have no value at all.

3. **Never hard delete.** A client removes a record by sending `_deleted: true` on the upsert, and
   the server writes it through the normal update path. `deleteOne`, `deleteMany` and
   `findOneAndDelete` are not the delete mechanism here.

4. **Plugin middleware is async — Mongoose 9 removed `next()`.** A pre hook is an `async function`
   (or a plain one) that signals failure by throwing; there is no callback to call. `insertMany` and
   `bulkWrite` hooks still fire at runtime but were dropped from Mongoose 9's exported middleware
   unions, so `change-tracking.plugin.ts` registers those two through a small documented shim.

5. **Only use operations the plugins hook.** `registerGlobalPlugins` attaches change tracking and
   activity logging to the connection, covering `save`, `updateOne`, `updateMany`,
   `findOneAndUpdate` (and `findByIdAndUpdate`, which routes to the same middleware), `replaceOne`,
   `findOneAndReplace`, `insertMany` and `bulkWrite`. An operation outside that list writes rows
   with no `org`, no `createdBy`, no `updatedBy` and no audit entry.

6. **Never set `org`, `createdBy`, `updatedBy`, `createdAt` or `updatedAt` in a query.** The plugin
   stamps the first three from the CLS request context and Mongoose owns the timestamps. Writing
   them by hand is at best redundant and at worst lets a client claim ownership. To write into
   another org deliberately, wrap the call in `RequestContextService.withOrg()`.

7. **`.lean<T>()` on every read.** All 92 reads do. It returns plain objects, which is what the
   mappers expect, and skips hydration. The trade-off is real: a lean result has no document
   methods, no getters and no `save()`. If you need those, do not lean — and then you are working
   with a document, so type it as one.

8. **The upsert shape is fixed:**

   ```ts
   findOneAndUpdate({ _id, org }, { ...payload }, { new: true, upsert: true, runValidators: true });
   ```

   `runValidators` matters: an upsert skips schema validation without it. `org` in the _filter_
   (not just the update) is what stops an upsert reaching into another organization.

9. **ObjectId lives in the schema, string lives in the DTO.** `BaseSchema` stores `org`,
   `createdBy` and `updatedBy` as `Types.ObjectId`; the DTOs carry strings; the mapper converts
   with `.toString()`. `new Types.ObjectId('')` throws, so use the non-throwing
   `getOrgIdSafe()` / `getUserIdSafe()` where a value may legitimately be absent.

## should

- **Index for the query you wrote.** The convention for an org-scoped entity is
  `{ org: 1, _deleted: 1 }`. A natural key gets a unique compound index that includes `org`, and
  **every unique index is partial on live rows**: `partialFilterExpression: { _deleted: false }`,
  plus `<field>: { $exists: true }` for an optional key (what `sparse` used to cover). Deletes are
  soft, and a plain unique index counted the deleted rows — re-creating a deleted standard's name
  or order failed with E11000. `chapter`, `material`, `standard`, `subject` and
  `standard-subject-mapping` are the examples. Order matters: `{ org, _deleted }` serves
  `find({ org, _deleted })` and `find({ org })`, but not `find({ _deleted })`.

- **`autoIndex` is not configured, so Mongoose's default stands and the app builds indexes at
  startup.** Two consequences worth knowing: a new index on a large collection costs startup time,
  and **changing** a definition does not drop the old index. That is exactly why the `orgId` → `org`
  rename needed the dev database dropped — the stale indexes lingered and kept enforcing the old
  shape. The fix that does not need a dropped database is `Model.syncIndexes()` in the module's
  `onModuleInit`, which drops what the schema no longer declares and builds what it does;
  `MaterialModule`, `StandardModule` and `SubjectModule` do this, and it is a no-op once they match.

- **Prefer fetching by ids over `populate`.** The codebase populates in exactly one method —
  `lookupInvite`, two calls, for `role` and `org` — because that `@Public()` response has to name
  the role and the organization for someone who has no session yet. Everywhere else the client stores are normalized maps keyed by `_id`, so a
  populated document fights the store rather than helping it. Use a `getXByIds(ids)` service method.

- **Strict mode is on by default, so an unknown key is dropped silently** rather than stored. That
  is why a client posting `isNew` never corrupted anything — but it also means a mistyped field name
  fails silently. The API's `forbidNonWhitelisted` is what actually catches that, not the schema.

- **There are no transactions anywhere today.** A multi-document write that must be atomic needs a
  session and a replica set. Until then, keep writes single-document and idempotent — the
  client-generated `_id` is what makes a retry safe.

- **Schema evolution, with no migration tool in the repo:** add the field optional, backfill it,
  then tighten. Adding `required: true` to a populated collection makes the next write of any old
  document fail validation, and nothing warns you first.

- **No aggregations exist yet.** While the collections are small, a query plus in-memory shaping is
  easier to read and to keep org-safe. If you add a pipeline, `$match` on `org` must come first —
  both for correctness and so the index is usable.

- `countDocuments` over `find().length`, and `exec()` on a query you are not leaning.

## Where the pieces are

```
src/database/base.schema.ts            _deleted, org, createdBy, updatedBy, createdAt, updatedAt
src/database/plugins/                  change-tracking, activity-logging, register-plugins
src/modules/<domain>/<domain>.schema.ts  the entity, its indexes at the bottom
src/modules/<domain>/schemas/          embedded sub-schemas (@Schema({ _id: false }))
```

## Verifying a data change

There is no test suite, so a query change is verified by running it. `add-server-module` has the
module-level checks; for data specifically:

```bash
pnpm start:server
curl -s localhost:9000/health     # OK only if Mongoose actually connected
```

Then do one write and read the row back to confirm `org`, `createdBy` and `updatedBy` were stamped,
and one read to confirm a `_deleted` row stays invisible. A query that looks right and a plugin that
fired are different claims.

## Related skills

- `add-server-module` — the schema, the module wiring and what the pipeline already does
- `add-api-endpoint` — the route, its access decorators and the DTO
- `define-data-shape` — where the entity's types belong
