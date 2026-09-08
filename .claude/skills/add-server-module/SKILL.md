---
description: >
  Create or restructure a NestJS module in apps/server — the module wiring, the Mongoose schema,
  the service, and registering it with the root module. Most of what a module needs already happens
  to it: two global guards, a response envelope, an exception filter, a CLS request context and two
  Mongoose plugins. Knowing what the pipeline does for you is the difference between a twenty-line
  module and a duplicated framework.
when_to_use: >
  Trigger BEFORE creating a folder under apps/server/src/modules, before adding a Mongoose schema,
  and before touching app.module.ts. Specifically: (1) a new domain or entity on the server;
  (2) "add a table/collection"; (3) one module needs a service from another; (4) you are about to
  write a guard, interceptor, exception filter or `process.env` read; (5) a module exists but its
  files are not in the shape below. Use `add-api-endpoint` instead when the module already exists
  and you are adding or changing a route.
argument-hint: '[the domain, e.g. attendance]'
---

# Add a server module

NestJS 10 on Fastify, Mongoose 8, one module per domain. Read `apps/server/src/modules/batch` for
the smallest complete example: four files, ninety lines, and every cross-cutting concern handled
elsewhere.

## must

1. **Four files in one folder, named for the domain.**

   ```
   src/modules/<domain>/
     <domain>.module.ts       @Module: forFeature, controllers, providers, exports
     <domain>.controller.ts   routes and access decorators
     <domain>.service.ts      the queries; takes org, throws Nest exceptions
     <domain>.schema.ts       the Mongoose schema
     <domain>.mapper.ts       only when the entity has a response contract
     schemas/                 only when the entity owns sub-schemas
   ```

2. **Register the module in `app.module.ts`.** A module that is not in that `imports` array is not
   loaded, and nothing will tell you: the routes simply 404.

3. **The root schema extends `BaseSchema`.** All thirty entity schemas do. It supplies
   `_deleted`, `org`, `createdBy`, `updatedBy`, `createdAt` and `updatedAt`, with `org` and
   `createdBy` marked `immutable`. A sub-schema embedded in a parent document does not extend it
   and is declared `@Schema({ _id: false })` — it has no independent ownership or lifetime.

   ```ts
   export type BatchDocument = HydratedDocument<Batch>;

   @Schema({ timestamps: true })
   export class Batch extends BaseSchema {
     @Prop({ type: String, trim: true, required: true })
     name: string;

     @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Standard' })
     standard: string;
   }

   export const BatchSchema = SchemaFactory.createForClass(Batch);

   BatchSchema.index({ org: 1, _deleted: 1 });
   ```

4. **Never fill the ownership fields yourself.** `registerGlobalPlugins` attaches both plugins to
   the connection once, in `MongooseModule.forRootAsync`, so *every* model gets them. Change
   tracking stamps `org`, `createdBy` and `updatedBy` from the CLS request context on `save`,
   `updateOne`, `updateMany`, `findOneAndUpdate`, `replaceOne`, `findOneAndReplace`, `insertMany`
   and `bulkWrite`; activity logging records the change. Setting those fields in a service — or in
   `$setOnInsert` — is redundant at best and lets a client claim ownership at worst.

5. **Do not add a guard, interceptor or filter for something the pipeline already does.** See the
   table below. In particular: a controller returns the payload, never `{ data: payload }`, because
   `TransformInterceptor` adds the envelope; and a thrown `HttpException` already renders as
   `{ error: { code, message } }`.

6. **Configuration comes from `SecretsService`**, with the key added to the `Secrets` enum. Use
   `getOrThrow<T>()` for anything the code cannot run without — `get<T>()` returns
   `T | undefined`, and a missing secret that reaches a signature check silently is worse than a
   crash at startup. No `process.env` reads inside a module.

7. **Request-scoped values come from `RequestContextService`**, not from parameters threaded down
   the call stack: `getOrgId()`, `getUserId()`, `getRole()`, `getSubdomain()`, plus the
   non-throwing `get*Safe()` variants for code that can run outside a request. Use
   `withOrg(org, fn)` to write deliberately into another organization, which is the only way the
   plugin will stamp a different `org`.

8. **Every query is scoped to one organization**, and every read excludes `_deleted`. That belongs
   to the route work — see `add-api-endpoint` — but it is the reason a module exists at all.

## should

- Keep the service HTTP-free: it takes `org: Types.ObjectId` and DTOs, returns
  `.lean<XDocument>()` documents (or `XDocument | null`), and throws `NotFoundException` /
  `ForbiddenException` rather than returning an error shape. The controller owns the request
  context and the status code.
- Index what you actually query. The convention for an org-scoped entity is
  `{ org: 1, _deleted: 1 }`, which nine schemas carry today, plus a unique compound index that
  includes `org` for a natural key — `chapter` and `material` both do this with
  `{ unique: true, sparse: true }`. Adding the pair to a schema you are already editing is welcome;
  the org filter is on every read either way.
- Export the service from its module when another module injects it, and import that module rather
  than reaching for the model directly. Two modules sharing a model is a sign the boundary is wrong.
- A module with no persistence needs only `providers` and `exports`; `S3Module` and `SendGridModule`
  are the examples.
- A genuine cycle uses `forwardRef(() => XModule)`, as `UserModule` and `InviteModule` do. Prefer
  splitting the shared piece into its own module first — `ActivityLogCoreModule` exists for exactly
  that reason.
- `@Global()` is for a provider that truly every module needs (`ContextModule`,
  `ActivityLogCoreModule`). Anywhere else it hides the dependency.
- Log through nestjs-pino's `Logger`. Automatic request logging is off and the authorization header
  is redacted; `console.log` is an ESLint warning.
- Name the class after the file: `BatchModule`, `BatchController`, `BatchService`, `Batch`,
  `BatchSchema`, `BatchDocument`.

## What the pipeline already does

| Stage             | Component                            | What it means for your module                                    |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------- |
| Authentication    | `AuthGuard` (first `APP_GUARD`)      | Verifies the Firebase JWT, resolves the subdomain, fills the CLS context |
| Authorization     | `AccessGuard` (second `APP_GUARD`)   | Enforces `@Permissions` / `@Subdomains`; a route declaring neither is refused |
| Validation        | global `ValidationPipe`              | Validates and whitelists a body whose metatype is a class — see `add-api-endpoint` for arrays |
| Response          | `TransformInterceptor`               | Wraps the return value as `{ data }`                              |
| Errors            | `HttpExceptionFilter`                | Renders an `HttpException` as `{ error: { code, message } }`       |
| Ownership fields  | `change-tracking.plugin`             | Stamps `org`, `createdBy`, `updatedBy` on every write             |
| Audit trail       | `activity-logging.plugin`            | Records the change, per model                                     |
| Request state     | `ClsModule` + `RequestContextService`| Makes the user, org, role and subdomain available anywhere        |
| Config            | `SecretsService`                     | Loads and validates secrets at boot                               |
| Logging           | nestjs-pino                          | Structured logs, authorization redacted                           |

The guards are registered in that order on purpose: `AccessGuard` reads the context `AuthGuard`
fills, so swapping them breaks authorization silently.

## The shape of the module file

```ts
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Batch.name, schema: BatchSchema }]),
    // other modules whose services this one injects
  ],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService], // only if another module injects it
})
export class BatchModule {}
```

## Steps

1. Run `define-data-shape` to settle where the types live: the DTO belongs in `packages/shared`,
   and `query-with-mongoose` for the schema, index and query conventions.
2. Write the schema (`extends BaseSchema`, `HydratedDocument`, `SchemaFactory`, the indexes).
3. Write the module with `forFeature`.
4. Write the service — org-scoped, soft-delete aware, `| null` where a lookup can miss.
5. Write the controller. `add-api-endpoint` covers the decorators and the body validation.
6. Add the module to `app.module.ts`.
7. Verify with `verify-changes`. For a module, also load the compiled graph, which evaluates every
   decorator and catches a missing provider without needing a database:

   ```bash
   pnpm build:server
   cd apps/server && node -e "require('./dist/app.module.js')"
   ```

## Where the shared pieces live

```
src/context/      RequestContextService, the CLS request context (@Global)
src/database/     base.schema.ts and plugins/ (change tracking, activity logging)
src/decorators/   @Public, @Private, @Permissions, @Subdomains, @User
src/guards/       AuthGuard, AccessGuard
src/interceptors/ TransformInterceptor
src/filters/      HttpExceptionFilter
src/secrets/      SecretsService and the Secrets enum
src/utils/        helpers with no Nest dependency
```
