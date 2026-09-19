# Shared data contracts plan

Goal: the apps should know exactly what the API sends, and the compiler should
say so. When this was written that knowledge lived only in each app's MobX State Tree models,
maintained by hand, and it has drifted from the server.

## Where things stand

Measured across the entities that have both a server schema and a client model.
"Server only" counts fields the API can send that no client model declares;
"client only" counts fields a client model declares that the API never sends,
ignoring the base ownership fields and `_id`.

| Entity     | Server fields | Client fields | Server only | Client only |
| ---------- | ------------- | ------------- | ----------- | ----------- |
| user       | 24            | 19            | 9           | 3           |
| org        | 6             | 4             | 3           | 0           |
| course     | 15            | 15            | 2           | 1           |
| material   | 14            | 13            | 3           | 1           |
| test-paper | 22            | 18            | 6           | 1           |
| question   | 17            | 15            | 5           | 2           |
| plan       | 14            | 14            | 2           | 1           |
| batch      | 3             | 5             | 0           | 1           |
| meet       | 17            | 19            | 0           | 1           |
| subject    | 4             | 3             | 2           | 0           |

Four different problems hide in those numbers.

1. **Fields the apps cannot read.** 32 server fields have no client
   counterpart. Some are deliberately private, such as `user.removedPermissions`
   and `org.specialPermissions`. Others look like oversights: `user.timezone`,
   `user.isInactive`, `course.status`, `course.thumbnail`, `material.url`,
   `test-paper.totalMarks`. Nothing tells a frontend developer which is which.
2. **Genuine naming drift.** The server stores `avatar` while every client model
   calls it `photoUrl`. Nothing catches that; a request payload mapper papers
   over it in one direction only.
3. **Legacy fields on the server.** `question` carries both `question` and
   `text`, and both `questionType` and `type`. The apps read the first of each
   pair, so the others are dead weight that still ships in every response.
   `test-paper` has the same duplication with `type`.
4. **View state mixed into the wire shape.** `isNew` is a form flag on nine
   entities, and `question.topic` exists only on the client. They sit in the
   same model as server fields with nothing marking them as local.

What is already right, and worth preserving:

- `enums/` is shared, so both sides agree on every enumerated value.
- `responses/` already defines `ApiResponse`, `SuccessResponse` and
  `ErrorResponse`, and the server's `TransformInterceptor` returns
  `SuccessResponse<T>`.
- `dtos/index.ts` deliberately keeps the class-validator DTOs out of the root
  barrel, so importing `@repo/shared` in a browser bundle pulls no
  validation machinery. Verified: no client file imports the `validations`
  subpath, and no validator code reaches the built chunks.

The missing piece is a **response contract**. There is no type describing what
an endpoint returns, and `callAuthApi` returns an implicit `any`, so no
mistake on either side is ever caught.

## The contract, in three parts

**Requests** stay as they are: classes with class-validator decorators, under
`@repo/shared/validations`, imported only by the server. They are runtime
validators first and types second.

**Responses** become plain TypeScript interfaces with no decorators, under a
new `@repo/shared/contracts`. No imports beyond enums, so they are free to
use in the browser.

**The envelope** is the existing `SuccessResponse<T>` and `ErrorResponse`.

### Serialization rules

A response contract describes what crosses the wire, not what Mongoose holds.
These rules are absolute so the interfaces never need to say "or ObjectId".

- Every `ObjectId` is a `string`.
- Every `Date` is an ISO 8601 `string`.
- A calendar date with no time, such as `dob`, is a `YYYY-MM-DD` `string`.
- `_deleted` and `__v` are never sent.
- A field the client must not see is absent from the interface and stripped by
  the mapper, not sent and ignored.
- An optional field means the API may omit it. Anything else is always present.

## File layout

```
packages/shared/src/
  contracts/                  # NEW: response shapes, browser-safe, no decorators
    index.ts
    base.contract.ts          # BaseFields, shared by every entity
    user.contract.ts          # UserDto, OrgDto, RoleDto
    course.contract.ts        # CourseDto, CourseModuleDto
    material.contract.ts
    test-paper.contract.ts    # TestPaperDto, TestPaperSectionDto
    question.contract.ts      # QuestionDto, OptionDto, SolutionDto
    standard.contract.ts      # StandardDto, SubjectDto, ChapterDto
    meet.contract.ts          # MeetDto, BatchDto, PlanDto
  dtos/validations/           # unchanged: request DTOs, server only
  responses/                  # unchanged: the envelope
  enums/                      # unchanged
```

Add the subpath export alongside the existing ones:

```json
"./contracts": {
  "types": "./dist/contracts/index.d.ts",
  "default": "./dist/contracts/index.js"
}
```

### What a contract looks like

```ts
// packages/shared/src/contracts/base.contract.ts

/** Ownership fields every entity returns. `_deleted` and `__v` are never sent. */
export interface BaseFields {
  _id: string;
  org: string;
  createdBy: string;
  updatedBy: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}
```

```ts
// packages/shared/src/contracts/course.contract.ts
import { CourseStatus } from '../enums';
import { BaseFields } from './base.contract';

export interface CourseDto extends BaseFields {
  name: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  status?: CourseStatus;
  tag?: string;
  standards: string[];
  subjects: string[];
}
```

One interface per entity, one name per concept. Where the current server schema
has two names for one thing, the contract keeps the one the apps already use
and the legacy field is deleted from the schema.

## How the server uses it

Each module gets a mapper that converts a document to its contract. This is the
only place that knows about `ObjectId` and `Date`, and the `satisfies` operator
makes the compiler check the result.

```ts
// apps/server/src/modules/course/course.mapper.ts
import { CourseDto } from '@repo/shared/contracts';
import { CourseDocument } from './course.schema';

export const toCourseDto = (course: CourseDocument): CourseDto =>
  ({
    _id: course._id.toString(),
    org: course.org.toString(),
    createdBy: course.createdBy.toString(),
    updatedBy: course.updatedBy.toString(),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    name: course.name,
    slug: course.slug,
    description: course.description,
    thumbnail: course.thumbnail,
    status: course.status,
    tag: course.tag,
    standards: course.standards?.map(String) ?? [],
    subjects: course.subjects?.map(String) ?? [],
  }) satisfies CourseDto;
```

Controllers then declare the contract as their return type, which is what makes
a mistake a build failure rather than a runtime surprise:

```ts
  @Get('all')
  @Subdomains(Subdomain.LEARN, Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getOrgCourses(): Promise<CourseDto[]> {
    const courses = await this.courseService.getOrgCourses(this.requestContextService.getOrgId());
    return courses.map(toCourseDto);
  }
```

A mapper is deliberately explicit rather than a spread. Spreading a lean
document leaks `_deleted`, `__v` and any field added later, which is how the
current responses grew fields no client expects.

Standards, subjects and their mappings have no mapper yet. Until they get one,
their services keep `__v` out at the query — `.select('-__v')` on reads and
`projection: { __v: 0 }` on the upserts — because the support dashboard posts a
loaded row straight back, and the global `forbidNonWhitelisted` rejected every
edit with "property __v should not exist".

## How the apps use it

**Type the HTTP layer once.** This single change turns every service call from
`any` into a checked shape.

```ts
// apps/<app>/src/services/http.service.ts
export const callAuthApi = async <T>(
  url: string,
  method: API,
  data?: object | null,
  shouldNotThrowError?: boolean,
): Promise<SuccessResponse<T>> => {
  /* unchanged body */
};
```

```ts
// apps/teaching/src/services/course.service.ts
getCourses = async () => await callAuthApi<CourseDto[]>('course/all', API.GET);
```

**Client-only fields are stripped in the HTTP layer.** The models add keys the API never accepts,
and the validation pipe runs with `forbidNonWhitelisted`, so one undeclared property fails the
whole request. Each app's `http.service.ts` passes every body and query object through `toPayload`
from `@repo/ui/lib`, which snapshots the instance — arrays included — and removes those keys at any
depth. A service method therefore just posts what it has:

```ts
const resData = await callAuthApi<CourseDto>(url, API.POST, payload);
```

The key list lives in `packages/ui/src/lib/payload.ts` with a comment explaining each entry; adding
a field to a schema and its DTO means removing it from that list. This began as a `toPayload` call
at each of the nineteen write sites, which is why it moved: the array writes were missed, and
nothing failed loudly because Nest does not validate array bodies unless the handler asks it to
with `ParseArrayPipe`.

**Separate the wire shape from view state** in the models. Declare the server
fields, then the UI-only fields under a comment, so it is obvious which is
which and a reviewer can see when the two have diverged.

```ts
// apps/teaching/src/stores/models/course.model.ts
export const Course = t.compose(
  BaseTimestampModel,
  BaseOrgModel,
  t.model('Course', {
    // --- wire fields, must match CourseDto ---
    _id: t.identifier,
    name: t.string,
    slug: t.maybeNull(t.string),
    status: t.maybeNull(t.enumeration('CourseStatus', Object.values(CourseStatus))),
    standards: t.optional(t.array(t.string), []),
    subjects: t.optional(t.array(t.string), []),

    // --- client only, never sent to or from the API ---
    isNew: t.optional(t.boolean, false),
    daysCount: t.optional(t.number, 0),
  }),
);
```

**Assert the two agree, at compile time.** This was the plan while the stores
were MobX State Tree: MST needs runtime type declarations, so a model could not
be generated from an interface, and one guard line per model closed the loop.

```ts
// The guard this section proposed, now obsolete.
const _assertCourseWire: (dto: CourseDto) => ICourseSnapshotIn = (dto) => dto;
```

**The Zustand migration removed the need for it.** A store entity is now
derived from its DTO — `export type ICourse = ClientEntity<CourseDto>` — so the
two cannot disagree: adding a field to the DTO adds it to the store, and the
compiler names every call site that has to change. What survives is the rule it
implied: never hand-write a structural copy of a DTO.

## Migration order

Each phase is independently shippable and leaves the tree green.

1. **Add `contracts/` with `BaseFields` and the subpath export.** No behaviour
   change.
2. **Make `callAuthApi` generic**, defaulting `T` to `unknown` so existing call
   sites keep compiling. Nothing is typed yet, but the seam exists.
3. **Do one entity end to end**, ideally `course`: write `CourseDto`, add the
   mapper, set the controller return types, type the client service, split the
   model's wire and view fields, and add the assertion line. This is the
   template and should be reviewed as such.
4. **Repeat per entity**, one commit each, in rough dependency order: user and
   org, standard and subject and chapter, material, question, test-paper, then
   meet, batch and plan.
5. **Delete the legacy server fields** the contracts left out, once nothing
   reads them: `question.text`, `question.type`, `question.marks`.
6. **Rename `photoUrl` to `avatar`** in the apps so the payload mapper's
   translation can be deleted and both sides use one name.
7. **Turn the default off**: change `callAuthApi<T>` so `T` is required, making
   an untyped call a build error.

Steps 1 and 2 are a single small commit. Step 3 is the one to get right.

## Naming rules

| Kind                   | Name              | Location                   |
| ---------------------- | ----------------- | -------------------------- |
| Response for an entity | `CourseDto`       | `@repo/shared/contracts`   |
| Nested response object | `CourseModuleDto` | same file as its parent    |
| Request body           | `UpsertCourseDto` | `@repo/shared/validations` |
| Query parameters       | `CourseQueryDto`  | `@repo/shared/validations` |
| Envelope               | `SuccessResponse` | `@repo/shared`             |

One suffix, `Dto`, for both directions, distinguished by the verb prefix on
requests. Never reuse a validation class as a response type: it drags
class-validator into the browser and describes input rules, not output shape.

## Mismatches to resolve while migrating

| Where        | Problem                                     | Resolution                              |
| ------------ | ------------------------------------------- | --------------------------------------- |
| user         | server `avatar` vs client `photoUrl`        | contract uses `avatar`; rename in apps  |
| user         | `permission` is derived, not stored         | keep in contract, document as derived   |
| question     | `question` and `text` both exist            | contract keeps `question`; drop `text`  |
| question     | `questionType` and `type` both exist        | keep `questionType`; drop `type`        |
| test-paper   | legacy `type` beside `paperType`            | keep `paperType`; drop `type`           |
| course       | `status` and `thumbnail` unreadable by apps | add to the contract and the models      |
| user         | `timezone`, `isInactive` unreadable by apps | add to the contract and the models      |
| user, org    | `removedPermissions`, `specialPermissions`  | deliberately private; omit and document |
| question     | client-only `topic`                         | mark client-only in the model           |
| every entity | `isNew` is a form flag                      | mark client-only in the model           |
| every entity | client `isDeleted` vs server `_deleted`     | never sent; drop from client base model |

## Alternatives considered

**Generate types from the Mongoose schemas.** Rejected: it couples the wire
shape to storage, so every column rename becomes a breaking API change, and it
cannot express "this field is hidden from students".

**One Zod schema per entity, used for validation and types on both sides.**
Genuinely attractive, and it would replace class-validator with a single
source of truth that also validates responses in development. Rejected for now
only because it means rewriting all 13 request DTOs and changing the global
`ValidationPipe`. Worth revisiting once the contracts exist, since the
interfaces would then be inferred rather than hand-written.

**Generate a client from OpenAPI via `@nestjs/swagger`.** Complementary rather
than an alternative. Once controllers declare contract return types, adding
Swagger gives browsable docs almost for free. It does not remove the need for
the contracts — the apps type their stores against them directly — and a
generated client would duplicate what `contracts/` already provides.

## Authored content and AI reply formats (added 2026-09-19)

Two families of shape sit beside the entity contracts and follow the same rules.

**Authored content** is `IRichText` (`packages/shared/src/interfaces/rich-text.interface.ts`):
`format: 'doc/v1'`, `doc` (the ProseMirror document), `text` (the plain-text projection, written
on every save and the only thing search, sort and previews read). The request side is
`RichTextDto` in `dtos/validations/rich-text.dto.ts`, which validates the envelope only — the
tree is not rebuilt against the editor schema on the server yet. Fields that hold it:
`Material.content`, a question's `body` and its options' and solution's `body`,
`TestPaper.instruction`. The full model, and the Markdown subset the importer and exporter
agree on, is in `packages/ui/src/editor/README.md`.

**AI reply formats** are pure interfaces in `packages/shared/src/interfaces/ai-*.interface.ts`
(`IAiTestPaper`, format `acadimic.test-paper/v1`; `IAiStudyMaterial`, format
`acadimic.study-material/v1`). They are _not_ DTOs: a model's reply is parsed, repaired and
validated in the teaching app, then turned into ordinary entity DTOs and written through the bulk
routes (`question/bulk-upsert`, `material/bulk-upsert`), so the server sees nothing new. Content
fields in these formats are Markdown strings, never documents. Each format carries the workspace
ids the prompt listed, so the importer never matches by name.

**Two small wire shapes** live in `contracts/`: `IPresignedUrl` (`key`, `url`) for uploads, and
`ILinkCheck` (`url`, `ok`, `status`, `contentType`, `error`) returned by `common/verify-links`.
