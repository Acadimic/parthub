# API conventions

How every endpoint in `apps/server` is structured, and why. Three client apps
(`learning`, `teaching`, `support`) call this one API. The rules below keep that
consistent without duplicating a controller per app.

## The rules

1. **One controller per resource, not per app.** `CourseController` owns every
   course endpoint regardless of which app calls it.
2. **Access is declared, never checked inline.** Every route carries
   `@Permissions(...)`, and `@Subdomains(...)` when it is app-specific. A global
   guard enforces both. No handler calls `permissionService.requireAny` itself.
3. **A route with no `@Permissions` is not callable.** The guard fails closed, so
   forgetting the decorator denies access rather than exposing the endpoint.
4. **Tenancy comes from the request context only.** Read `org`, `userId` and
   `role` through `RequestContextService`. Never accept them from a body, query
   or header, because the client can change those.
5. **Handlers return the payload, not an envelope.** The global
   `TransformInterceptor` wraps every response in `{ data }`. Returning
   `{ data, status }` yourself produces `{ data: { data, status } }`.
6. **Handlers stay thin.** Read the context, call a service, return. Business
   logic and all database access live in the service.
7. **Services are app-agnostic and org-scoped.** A service takes `org` as an
   argument and knows nothing about subdomains. The same service method serves
   all three apps.
8. **Shared request and response types live in `@repo/shared`.** DTOs are
   validated by the global `ValidationPipe`, which runs with
   `forbidNonWhitelisted`, so an unknown key fails the whole request.

## Why not a controller per subdomain

Measured across the 97 routes before this convention:

| Measure                                            | Count |
| -------------------------------------------------- | ----- |
| Total routes                                       | 97    |
| Routes that enforced a permission                  | 13    |
| Routes whose behaviour depended on the subdomain   | 1     |
| Endpoints duplicated identically across subdomains | 9     |

The subdomain was a naming convention rather than a boundary. It changed
behaviour in exactly one place (choosing the owner role during sign-up) and
nothing rejected a `teach/`-prefixed call made from the learning app.
Meanwhile nine endpoints, including `course/all` and `standard/all`, had
byte-identical bodies under two or three prefixes.

Splitting controllers by subdomain would have tripled the file count, made that
duplication permanent, and still left 84 routes with no authorization check.

The real axes of variation are **who may call an endpoint** and **what data it
may read**. Neither maps onto the subdomain: support and teach read standards
identically and differ only in who may write them; learn and teach read org
courses identically and differ only in what a student should see inside one.
So permissions became the enforced boundary, and the subdomain is declared only
where an app genuinely must be restricted.

## Plumbing

Four pieces, added once.

```ts
// src/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { PermissionItem } from '@repo/shared';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: PermissionItem[]) => SetMetadata(PERMISSIONS_KEY, permissions);
```

```ts
// src/decorators/subdomains.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Subdomain } from '@repo/shared';

export const SUBDOMAINS_KEY = 'subdomains';
export const Subdomains = (...subdomains: Subdomain[]) => SetMetadata(SUBDOMAINS_KEY, subdomains);
```

```ts
// src/guards/access.guard.ts
// Runs after AuthGuard, which has already resolved the user and populated the request context.
import { PERMISSIONS_KEY } from '@decorators/permissions.decorator';
import { IS_PRIVATE_KEY } from '@decorators/private.decorator';
import { IS_PUBLIC_KEY } from '@decorators/public.decorator';
import { SUBDOMAINS_KEY } from '@decorators/subdomains.decorator';
import { PermissionService } from '@modules/permissions/permission.service';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionItem, Subdomain } from '@repo/shared';
import { RequestContextService } from '../context/request-context.service';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
    private readonly requestContextService: RequestContextService,
  ) {}

  private get<T>(context: ExecutionContext, key: string) {
    return this.reflector.getAllAndOverride<T>(key, [context.getHandler(), context.getClass()]);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() and @Private() routes are authenticated (or not) by AuthGuard alone.
    if (this.get<boolean>(context, IS_PUBLIC_KEY) || this.get<boolean>(context, IS_PRIVATE_KEY)) return true;

    const allowed = this.get<Subdomain[]>(context, SUBDOMAINS_KEY);
    if (allowed?.length) {
      const subdomain = this.requestContextService.getSubdomain();
      if (!subdomain || !allowed.includes(subdomain)) {
        throw new ForbiddenException('This endpoint is not available for this app.');
      }
    }

    const permissions = this.get<PermissionItem[]>(context, PERMISSIONS_KEY);
    // Fail closed: an endpoint that declares nothing is not callable.
    if (!permissions?.length) {
      throw new ForbiddenException('This endpoint declares no required permission.');
    }
    await this.permissionService.requireAny(permissions);
    return true;
  }
}
```

```ts
// src/app.module.ts — guards run in registration order, so AuthGuard stays first
providers: [
  { provide: APP_GUARD, useClass: AuthGuard },
  { provide: APP_GUARD, useClass: AccessGuard },
  AppService,
],
```

## Example: a teaching write

```ts
@Controller('course')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.CREATE_COURSE, PermissionItem.EDIT_COURSE)
  async upsertCourse(@Body() payload: UpsertCourseDto): Promise<CourseDto> {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    return await this.courseService.upsert(userId, org, payload);
  }
}
```

This is the template for every endpoint:

- the tenancy keys come from the context, never from `payload`;
- the handler returns the payload directly and lets the interceptor wrap it;
- access sits above the method, where a reviewer sees it next to the route.

`@Permissions` is an **any-of** check, matching `PermissionService.requireAny`.
Use several values when more than one role may perform the action.

## Example: one read serving learning and teaching

```ts
  @Get('all')
  @Subdomains(Subdomain.LEARN, Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getOrgCourses(): Promise<CourseDto[]> {
    return await this.courseService.getOrgCourses(this.requestContextService.getOrgId());
  }
```

This replaces a `teach/all` and `learn/all` pair whose bodies were identical.
The apps differ in the permission their role holds, not in the code.

Where a learner must genuinely see a narrower shape, keep one query and add a
view mapper. Do not add a second route.

```ts
  @Get(':id')
  @Subdomains(Subdomain.LEARN, Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCourseById(@Param('id') id: string): Promise<CourseDto> {
    const course = await this.courseService.getOrgCourseById(this.requestContextService.getOrgId(), id);
    // One source of truth for the query; visibility decided by role, not by URL.
    return this.courseView.forRole(course, this.requestContextService.getRole());
  }
```

Note that the lookup is org-scoped. A bare `findById(id)` lets any authenticated
user read another organization's document by guessing an id.

## Example: a support write over platform data

```ts
@Controller('standard')
export class StandardController {
  @Post('upsert')
  @Subdomains(Subdomain.SUPPORT)
  @Permissions(PermissionItem.MANAGE_STANDARD)
  async upsertStandard(@Body() payload: UpsertStandardDto): Promise<StandardDto> {
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    return await this.standardService.upsert(userId, org, payload);
  }

  @Get('all')
  @Subdomains(Subdomain.SUPPORT, Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getAllStandards(): Promise<StandardDto[]> {
    return await this.standardService.getAll();
  }
}
```

Standards, subjects and questions are platform data, so the read is
deliberately unscoped and shared by all three apps, replacing the identical
`support/all` and `teach/all` handlers. Only the write is support-only.

Platform collections still extend `BaseSchema`, so a write is stamped with the
acting user's org for auditing. That org is not a tenancy filter for these
collections, and reads must not filter on it.

## Naming

| Concern           | Convention                                       | Example                    |
| ----------------- | ------------------------------------------------ | -------------------------- |
| Controller path   | singular resource                                | `@Controller('course')`    |
| Create or update  | `POST <resource>/upsert`                         | `POST course/upsert`       |
| List for an org   | `GET <resource>/all`                             | `GET course/all`           |
| Single item       | `GET <resource>/:id`                             | `GET course/:id`           |
| Several in full   | `POST <resource>/ids` with `{ ids }`             | `POST material/ids`        |
| Nested list       | `GET <resource>/<parent>/:parentId`              | `GET chapter/course/:id`   |
| Bulk write        | `POST <resource>/bulk-upsert`                    | `POST subject/bulk-upsert` |
| Soft delete       | `POST <resource>/delete` with `{ <resource>Id }` | `POST standard/delete`     |
| Action on an item | `POST <resource>/<verb>`                         | `POST user/revoke`         |

`invite/bulk/upsert` is the one older spelling; the five later bulk routes (material, question,
subject, standard, standard mapping) use `bulk-upsert`, and new ones should too. A delete is a
soft delete: the service sets `_deleted: true`, cascades to dependants (a standard's mappings), and
answers 404 when no live row has that id.

Do not put a subdomain in the path. `@Subdomains(...)` carries that, and it is
enforced rather than implied.

## List rows and full documents

A list route sends what its tables read, not whole documents. When an entity carries a heavy
field that no list shows (a lesson's `content` was 30 of an organization's 31 MB), the list query
leaves it out with an exclusion, `.select('-content')`, and the field stays optional on the DTO.
Exclude rather than list fields: `getTransformedBaseFields` reads `_id`, `org`, `createdBy` and
`updatedBy` unguarded, and an exclusion keeps them. Today: `material/*all` drop `content`,
`course/all` drops the AI syllabus arrays, `test-paper/all` drops `instruction`.

The screen that shows or edits the field reads the full document: `GET <resource>/:id`, or
`POST <resource>/ids` (a DTO with `@ArrayMaxSize`, so a body cannot ask for the whole collection).
The client store merges rows by id rather than replacing them, so a list load never takes back a
field an earlier full read brought, and an editor waits for the full row before it opens: opened
on a list row, a save would write an empty body over the real one. A write that leaves the field
out is safe on the server: `findOneAndUpdate` with a plain object is a `$set` of what was sent.

## Responses and errors

A successful response is always the interceptor's envelope:

```json
{ "data": { "_id": "...", "name": "..." } }
```

Errors come from `HttpExceptionFilter`, so throw Nest exceptions and let it
format them. Prefer the specific type: `ForbiddenException` for a permission
failure, `NotFoundException` for a missing document, `BadRequestException` for
input that passed validation but is not usable.

A MongoDB duplicate key (code 11000) is caught by `MongoDuplicateKeyFilter` and
answered as a 409 whose message names the colliding field and value, so a unique
index can stay the last line of defence without surfacing as a bare 500. Any
other `MongoServerError` still becomes a 500.

## Migrating an existing module

The guard fails closed, so annotate module by module.

1. Add `@Permissions` (and `@Subdomains` where the endpoint is app-specific) to
   every route in the controller.
2. Delete the inline `permissionService.requireAny` calls the decorators replace.
3. Drop the manual `{ data, status: HttpStatus.OK }` envelope and return the
   payload.
4. Remove the subdomain prefix from the path, collapsing duplicated
   `teach/`, `learn/` and `support/` routes into one.
5. Replace any client-supplied org with `requestContextService.getOrgId()`.
6. Update the matching service in `apps/<app>/src/services` to the new path.

For a staged rollout, have `AccessGuard` log a warning instead of throwing when
`@Permissions` is absent, then switch it to throw once every route is annotated.

## Known gaps this convention closes

- **Cross-tenant reads.** `course`, `material`, `subject` and `test-paper` each
  expose `findAll(@Query('org') org)` with no permission check, so any
  authenticated user can read another organization's data by passing a different
  id. Rule 4 removes the parameter; delete these routes if nothing calls them.
- **Unprotected endpoints.** Only 13 of 97 routes enforced a permission. Rule 3
  makes an undeclared route fail rather than allow.
- **Double-wrapped responses.** 62 handlers returned `{ data, status }` while the
  interceptor also wrapped in `{ data }`, so clients received
  `{ data: { data, status } }` from those routes and `{ data }` from the newer
  ones. Rule 5 makes every response the same shape.
- **Unenforced subdomains.** A `teach/`-prefixed route could be called from any
  app. `@Subdomains(...)` is checked by the guard.
