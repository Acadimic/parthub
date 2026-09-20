# Course Platform — End-to-End Structure

Status: proposal, 2026-09-16. Covers the domain from course down to option, plus language,
bundling, plans and access. Companion to `CONTENT_EDITOR_AND_EQUATIONS.md`, which owns how
authored content is *edited and stored*; this document owns what the content hangs off.

Reference read before writing: the live schemas in `apps/server/src/modules`, and the prior art in
`acadimic-cloud` (which has `CourseModule` and `Access`, neither yet in parthhub).

**Update, 2026-09-19.** The content-field changes in §2 are done: `Material.content`, a question's
body, options and solution, and `TestPaper.instruction` are `IRichText` documents (see
`packages/ui/src/editor/README.md`). Test papers and study material can be generated from an
external model and imported (`apps/teaching/src/utils/ai/`); the course generator that composes
them into day-by-day modules is planned in `AI_COURSE_GENERATOR.md` and depends on the
`CourseModule` shape described here. The rest of this document is still a proposal.

Four decisions were taken up front and everything below follows from them:

| Decision | Chosen |
| --- | --- |
| Module identity | **Day-based**, as today — `(course, day)` stays the key |
| Language | **A separate course per language** — not translations of one course |
| `Course.courses[]` | **A bundle** — the referenced course's content is included, and buying the outer grants the inner |
| Access | **Port `Access`** from acadimic-cloud — one row per product, with `startAt`/`endAt` |

**The language decision supersedes §9 of `CONTENT_EDITOR_AND_EQUATIONS.md`.** That section designed
`ContentTranslation` rows with `sourceVersion` staleness tracking, which is machinery for keeping
one document in sync across languages. A Hindi course being *its own course* needs none of it. §9
should be struck, and §4 below replaces it. What survives from that plan is everything about the
editor, the equation model, and `IRichText`.

---

## 1. The domain in one picture

```
CourseGroup (a shared key, not a collection)
  └── Course  ── language: 'en' ──┐
      │                           ├── siblings, same syllabus, different language
      └── Course  ── language: 'hi' ──┘
          │
          ├── courses[]  ────────────► Course (bundled — content included, access granted)
          │
          └── CourseModule  (day 1..N)
                ├── materials[]  ──► Material   ── content: IRichText
                ├── testPapers[] ──► TestPaper
                │                     └── sections[] ──► TestPaperSection
                │                            ├── subsections[] ──► TestPaperSection
                │                            └── questions   ──► Question ── question: IRichText
                │                                                   ├── options[] ──► Option ── option: IRichText
                │                                                   └── solution  ──► Solution ── solution: IRichText
                └── meets[]      ──► Meet

Plan  ── courses[] ──► Course            (one course, or several — a combined plan)
  │
  └── purchase ──► Access (user, product, startAt, endAt)   one row per course in the closure
```

---

## 2. What already exists, and what it needs

Most of this is *drawn*, and rather less of it is built than the schema files suggest. The table
below is the schema delta; §2.1 is the delta that actually matters, because four of these entities
have no server code at all. Read them together — sizing the work off the table alone would repeat
the mistake that produced the gap.

| Entity | Today | Change needed |
| --- | --- | --- |
| `Course` | name, description, thumbnail, standards[], subjects[], **courses[]**, meets[], attachments[], stats, isPublished | add `language`, `variantGroup`; bundle rules (§5) |
| `CourseModule` | course, name, day, materials[], testPapers[], meets[] | renamed from `CourseContent` (§3, done); add `language` guard |
| `Material` | name, content (string), attachments[], standard, subject, chapter, course, level, durationMins | `content` → `IRichText`; add `language`; resolve bank-vs-owned (§8) |
| `TestPaper` | name, sections[] (refs), totals, paperType, instruction, mergedTestPapers[] | `instruction` → `IRichText`; add `language`; drop `totalMarks`/`duration`/`type` (§2.3-H) |
| `TestPaperSection` | name, description, sectionType, defaultMarkings (Mixed), **subsections[]**, instruction | `description`/`instruction` → `IRichText`; `defaultMarkings` → real subdocument; add `language` (a shared section must not be composed into a paper of another language) — questions keep pointing *at* it (§12.3) |
| `Question` | question (string), options[], questionType, markings, section, subsection, level, marks, testPaper | `question` → `IRichText`; add `language`; **embed options + solution**; **delete `testPaper`** (§12.2); **add `order`** (§12.4); `section`/`subsection`/`marks`/`markings` **stay** |
| `Option` | option (string), question, isCorrect | **collection deleted** — embedded in `Question` as `options[]` (§12.3) |
| `Solution` | solution (string), question | **collection deleted** — embedded in `Question` as `solution` (§12.3) |
| `Plan` | name, description, **courses[]**, meets[], amount, currency, interval, period | nothing structural — combined plans already work |
| `CompletedModule` | course, courseModule, collectionItem (polymorphic), isCompleted, isSkipped | works; needs a rule for bundled content (§5.4) |
| `StudentProductMapping` | student, product (polymorphic), no dates | superseded by `Access` (§6) |
| — | — | **new: `Access`** (§6) |

Three things are already right and should not be touched: `Plan.courses[]` makes combined plans a
non-problem; `TestPaperSection.subsections[]` already gives sections and subsections one shape
rather than two; and `TestPaper.sections[]` holding *references* rather than embedded documents is
what lets a section be shared between papers (§12.1), which `mergeTestPapers` already relies on.

### 2.1 What actually persists — measured

The schema files above describe entities the server cannot read or write. Two checks establish it,
both mechanical and both repeatable:

```bash
# models a service can actually touch, vs. models merely registered
grep -rhoE "@InjectModel\(([A-Za-z]+)\.name\)" --include="*.service.ts" apps/server/src/modules
grep -rhoE "name: ([A-Za-z]+)\.name"             --include="*.module.ts"  apps/server/src/modules

# client call sites, vs. routes the controllers declare
grep -hoE "const url = [\`']([^\`']*)" apps/teaching/src/services/*.service.ts
```

**Six models are registered in `MongooseModule.forFeature` and injected into nothing:**
`Option`, `Solution`, `CompletedModule`, `TestPaperSection`, `TestPaperResult`,
`StudentProductMapping`. A registered-but-uninjected model compiles, starts and serves traffic; it
simply has no code path. That is why the gap survived — nothing fails loudly. `CourseModule` was the
seventh and has since been given its service and routes; re-run the greps above rather than trusting
this list.

**Eleven client calls have no matching route.** Seven are the sub-entity layer of these four flows:

| Client calls | Declared by |
| --- | --- |
| `POST course/upsert/course/module` | — |
| `POST course/upsert/course/plans` | — |
| `GET course/course/modules/:courseId` | — |
| `GET plan/course/:courseId` | — |
| `POST test-paper/section/upsert` | — |
| `POST test-paper/section/upsert-question` | — |
| `POST test-paper/section/upsert-bulk-questions` | — |
| `GET test-paper/sections-with-questions/:testPaperId` | — |

(The other three — `auth/register`, `user/initial-login-data`, `material/standards/all` — are
outside these flows but are the same defect.) There is no global prefix and no versioning in
`main.ts`, so these resolve to 404 rather than to something else.

**The four flows, end to end:**

| Flow | Authoring UI | Server route | Persists |
| --- | --- | --- | --- |
| Course — the course itself | yes | `course/upsert` | **yes** |
| Course modules | yes | none | **no** |
| Plans attached to a course | yes | none | **no** |
| Study material | yes | `material/upsert` | **yes** |
| Test paper — the paper itself | yes | `test-paper/upsert` | **yes** |
| Test paper sections | yes | none | **no** |
| Question | yes | `question/upsert` exists, **no caller** | **no** |
| Option | yes | none | **no** |
| Solution | yes | none | **no** |

Of the four flows in scope, **only study materials works end to end.** A course saves but has no
modules; a test paper saves but has no sections, and therefore no questions.

Two details worth carrying into the fix:

- **The question flow has a server endpoint it does not use.** `question/upsert` and
  `question/test-paper/:testPaperId` are implemented and correct — `findOneAndUpdate({_id, org}, …,
  {upsert: true, runValidators: true})`. The client ignores both and posts to
  `test-paper/section/upsert-question` instead, which does not exist. Whichever way this is
  resolved, it should be resolved once rather than leaving two intended shapes.
- **The failure is silent.** `UpsertQuestionFooter.handleSaveQuestion` wraps the call in
  `catch {}` — an empty block. The 404 is swallowed, the success toast never fires, and the modal
  stays open with no message. Any error handling added here is a product fix, not just hygiene.

### 2.2 The other half of the gap: options and solutions have no wire contract

`packages/shared/src/dtos/validations/` has no `option.dto.ts`, no `solution.dto.ts`, no
`section.dto.ts` and no `course-module.dto.ts`. `QuestionDto` carries `options?: string[]` — ObjectId
references only, no option content — so even the endpoint that does exist cannot round-trip an
answer. The client models all of it (`question.store.ts` has `createOption`, `upsertSolution`,
`getNewQuestions`, `getNewOptions`, `getNewSolutions`, all keyed by client-generated ObjectIds) and
then has nowhere to send it.

This is the reason to treat §7 as the *first* phase rather than the sixth: the option and solution
contracts have to be written from scratch either way, and writing them as `string` now only to
convert them to `IRichText` later is two passes over the same new code.

### 2.3 The schemas themselves, read line by line

Reachability was only half the audit. The five schemas behind these flows —
`test-paper.schema.ts`, `test-paper-section.schema.ts`, `question.schema.ts`, `option.schema.ts`,
`solution.schema.ts` — have defects that survive independently of the missing endpoints, and three
of them would be baked in permanently if the endpoints were written against the current shape.

**A. `Question.testPaper` is unsound, and dead.** A section is shared across papers
(`mergeTestPapers`, §12.1), so a question reached through one belongs to *every* paper referencing
that section — which a scalar `ObjectId` cannot express. It is also never written: `ICreateQuestion`
has no `testPaper`, and no assignment to it exists anywhere in the repo, so
`question/test-paper/:testPaperId` returns the empty set for every paper. **Delete it** (§12.2).

`section` and `subsection` are a different matter and **stay** (Manish, 2026-09-16): they point at a
shared section rather than at a paper, so they carry no such contradiction. Their scalar-ness does
mean a question lives in exactly one section, i.e. reuse happens at section granularity — a
deliberate trade, spelled out in §12.4.

**B. `marks` and `markings` are on `Question`, so a question is worth the same in every paper that
uses it.** ~~This is the wrong entity.~~ **Resolved as a deliberate decision, not a defect**
(Manish, 2026-09-16): marks stay on the question. In this domain the marking scheme follows the
question's *type* — a single-correct MCQ is +4/−1 wherever it appears — so the value is intrinsic
rather than per-paper, and authoring it once is the point of a bank. `TestPaperSection.defaultMarkings`
remains the fallback; see §12.4 for the precedence rule. The consequence to accept knowingly is in
§12.4 as well.

**C. Nothing is ordered.** Neither `Question` nor `TestPaperSection` has an `order`, `sequence` or
`position` field. Section order survives only as the array order of `TestPaper.sections[]`.
**Question order within a section does not exist at all** — `findBySections` returns
`find({section: {$in: …}})` in whatever order the storage engine yields. Question 1 is not reliably
question 1. Because the linkage points from question to section (§12.3), this needs an explicit
`order` field rather than an array position; see §12.4.

**D. Two relationships are stored twice, and can disagree.** `Question.options[]` ↔
`Option.question`, and `Question.testPaper` duplicating what `section` already implies. Two sources
of truth with no transaction across them, so any partial write desynchronises them silently. Both
are closed by §12: options are embedded, and `testPaper` is deleted — leaving exactly one direction
for each relationship (`TestPaper.sections[]` → section, question → section).

**E. Reading one paper costs hundreds of documents.** A 60-question paper with four options each is
1 `TestPaper` + 4 `TestPaperSection` + 60 `Question` + 240 `Option` + 60 `Solution` ≈ **365
documents across five collections**, and the client then reassembles them. `Solution` is a whole
collection for a strict 1:1 with no back-reference from `Question`.

**F. The indexes do not match the queries.** `QuestionSchema` declares `{standard: 1}`,
`{section: 1}` and `{section: 1, _deleted: 1}`. But `findAll` queries `{org, _deleted}` and
`findByTestPaper` queries `{testPaper, org, _deleted}` — **neither is indexed**, so both collection-
scan. `Question` is also the only entity in these flows missing the `{org: 1, _deleted: 1}` index
every sibling collection declares. Separately, `{section: 1}` is a redundant prefix of
`{section: 1, _deleted: 1}` and is pure write cost.

**G. `defaultMarkings` is `Mixed`.** Typed `Record<string, Record<string, number>>` but declared
`MongooseSchema.Types.Mixed`, so nothing validates it and in-place mutation needs an explicit
`markModified()` — which the connection's change-tracking plugin will also miss. `MarkingSchema`
already exists three files away as a real subdocument with `correct`/`incorrect`/`unattempted`.

**H (also on `Question`). Five fields are dead:** `testPaper`, `marks`, `type`, `text` and
`material` — no reads, no writes, in either app. Two of them are silent duplicates of fields that
*are* used: `marks` duplicates `markings.correct` (so the decision that marks stay on the question,
§2.3-B, has to name **`markings`**), and `type` overlaps `questionType`. §12.3.1 has the per-field
evidence.

**H. `TestPaper` carries two live duplicate pairs.** `maxMarks` *and* `totalMarks`; `durationMins`
*and* `duration`. Both members of both pairs are declared on the schema and in `TestPaperDto`;
`totalMarks` and `duration` are declared **only** on `TestPaper`, and the teaching app writes only
`maxMarks` and `durationMins`. Add `paperType` / `paperCategory` / `type` — three overlapping
classifiers, one of them an untyped bare `@Prop()`.

See **§12** for the shape that addresses A–H.


---

## 3. Modules stay day-based

`CourseModule` keeps `day` as its key and its unique `(course, day)` index. A course is a dated
run; `name` is the label on the day, not an identifier.

**The collection has been renamed to `CourseModule`** (it was `CourseContent`). It is called that in
acadimic-cloud, it is called that in conversation, and `CompletedModule.courseModule` already
pointed at it under that name — only the class and collection disagreed. What it took was the
Mongoose `collection` option below plus a data move: `coursecontents` renamed to `coursemodules`,
carrying its documents and indexes, and the `ActivityLog.entityType` rows retagged. The field list
below still describes the target shape, not today's — `description` is still a plain string, and the
unique index is not partial yet (§9).

```ts
@Schema({ timestamps: true, collection: 'coursemodules' })
export class CourseModule extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Course', required: true })
  course: string;

  @Prop({ type: String, trim: true, required: true })
  name: string;

  @Prop({ type: Number, required: true })
  day: number;

  @Prop({ type: RichTextSchemaDefinition })
  description: RichText;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Material' }])
  materials: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'TestPaper' }])
  testPapers: string[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Meet' }])
  meets: string[];
}

CourseModuleSchema.index({ course: 1, day: 1 }, { unique: true, partialFilterExpression: { _deleted: false } });
```

Note the `partialFilterExpression`: the existing unique index does not have one, so soft-deleting
day 3 and re-creating it **fails today**. That is a live bug, not a new concern — every unique index
in this codebase needs the same treatment (§9).

---

## 4. Language: a course per language

`Course.language` is a BCP-47 tag. A Hindi course is a different `Course` row with its own modules,
materials, test papers and questions. No translation documents, no `sourceVersion`, no staleness.

### 4.1 The part the decision does not cover

"A separate course per language" answers how content is stored. It does not say **how the English
course and the Hindi course know about each other** — and without that, they are two unrelated rows.
Two things break:

- A learner on the course page cannot be offered "also available in हिन्दी".
- An author has no way to see that the Hindi version is missing days 7–9, or that it exists at all.

So the variants need a shared key:

```ts
// Course
/** BCP-47. The language this course is taught in. */
@Prop({ type: String, required: true, default: 'en', trim: true })
language: string;

/**
 * Shared by every language variant of the same course. Minted when the first variant is created;
 * a course with no siblings simply has a group of one. A plain shared id rather than a
 * `CourseGroup` collection, because nothing yet needs to hang off the group itself — promote it to
 * a collection the day something does.
 */
@Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
variantGroup: string;
```

```ts
CourseSchema.index(
  { variantGroup: 1, language: 1 },
  { unique: true, partialFilterExpression: { _deleted: false } },
);
```

That index is the useful part: it makes "two Hindi versions of the same course" impossible, which is
the failure mode this model otherwise invites.

### 4.2 Language on the items, and the rule that matters

`Material`, `TestPaper` and `Question` are not owned by a course today — a material carries
`standard`/`subject`/`chapter` and a question carries `testPaper`. They are reusable, so they each
need their own `language`:

```ts
@Prop({ type: String, required: true, default: 'en', trim: true })
language: string;
```

And one integrity rule, enforced on write:

> **A module may only reference items whose `language` matches its course's `language`.**

Without it the model fails silently and in the worst possible way — a Hindi course quietly serving
English questions to a student mid-test. It is a cheap check in the service layer (the module's
course is already loaded to authorise the write) and there is no sensible reason to allow the
exception.

Options and the solution are embedded in `Question` (§12.3), so they carry its language by
construction and need no field of their own. `TestPaperSection` does need one: a shared section
(§12.1) must not be composed into a paper of a different language, which is the §4.2 rule applied
one level down.

### 4.3 What this buys, and what it costs

It buys simplicity: no translation workflow, no staleness detection, no per-field language
resolution on read, and an author who works in Hindi never sees English machinery.

It costs duplication. Two language variants of the same course are two full sets of modules and
items, and a correction to a physics question has to be made twice. That is the deliberate trade.
The mitigation, when it starts to hurt, is authoring tools rather than a schema change: "duplicate
this course into a new language" as a deep copy, and later an AI-assisted first pass over the copy
(`CONTENT_EDITOR_AND_EQUATIONS.md` §7 covers the machinery, which works unchanged on a copy).

---

## 5. Bundles

`Course.courses[]` means **the referenced course's content is included and its access is granted**.

### 5.1 Resolution

A learner's view of course A is A's own modules, then the modules of each course in `A.courses[]`,
in array order, each group labelled with its source course. Days are *not* interleaved — two courses
both having a "Day 1" is normal and merging them by number would produce nonsense.

Resolution is recursive: an included course may itself include others.

### 5.2 Cycles and depth

Nothing stops `A → B → A` today, and it would hang every read path that walks the graph.

- **Reject on write.** When `courses[]` is saved, compute the closure; if the course appears in its
  own closure, refuse with a message naming the cycle.
- **Cap the depth** at 3. Not because 4 is wrong, but because an uncapped recursive resolution on a
  hot read path is how a single bad edit takes the site down.

### 5.3 Language and bundles

A bundled course should share the outer course's `language`. An English course including a Hindi one
produces a reading list a student cannot read. Enforce it on write, with the same check as §4.2.

### 5.4 Progress and stats

`CompletedModule` is keyed on `(course, courseModule, collectionItem, createdBy)`. For bundled
content the `course` should be **the course the learner is enrolled in** (the outer one), not the
course that owns the module — otherwise progress made inside a bundle leaks between two learners who
reached the same inner course by different routes, and a bundle's progress cannot be reset
independently.

`Course.stats` is a denormalised count. With bundles it must be recomputed as own + included, and
recomputed again whenever `courses[]` changes on any course in the closure.

---

## 6. Plans, purchase and access

`Plan` needs no structural change. `Plan.courses[]` already supports both "a plan for one course"
and "a plan for several" — a combined plan is not a new concept, just a longer array.

Port `Access` from acadimic-cloud:

```ts
// apps/server/src/modules/access/access.schema.ts
@Schema({ timestamps: true })
export class Access extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'productRef', required: true })
  product: string;

  @Prop({ type: String, enum: ProductType, required: true })
  productRef: ProductType;

  @Prop({ type: Date, required: true })
  startAt: Date;

  @Prop({ type: Date, required: true })
  endAt: Date;

  /** The purchase this grant came from, so a refund can revoke exactly what it created. */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Plan' })
  plan: string;
}

AccessSchema.index({ user: 1, productRef: 1, product: 1, endAt: -1 });
AccessSchema.index({ org: 1, _deleted: 1 });
```

### 6.1 What a purchase writes

Buying plan P for period `[start, end)`:

1. Resolve `P.courses[]`.
2. For each, resolve its bundle closure (§5.1).
3. Write **one `Access` row per distinct course** in the union, all with the same window and `plan`.

One row per course rather than one per purchase, because access is checked on every content read and
a point lookup on `(user, product)` is the difference between an index hit and resolving a plan's
course list on every request.

### 6.2 The consequence to plan for

Writing the closure means access is a **snapshot**. If course A later adds course C to its bundle,
people who already bought A do not have C.

Resolve it with a reconciliation job rather than by moving to read-time resolution: when a course's
`courses[]` changes, enqueue a job that finds live `Access` rows for that course and adds rows for
the newly included ones, inheriting the window. Removal is the mirror. This keeps reads fast and
makes the correction explicit and auditable, which matters because it changes what people own.

### 6.3 Renewal and expiry

A renewal writes a new row rather than extending one — the history of what was owned when is worth
keeping, and `endAt: -1` in the index makes "the current grant" a single lookup. A user has access
when a live row exists with `startAt <= now < endAt`.

`StudentProductMapping` is superseded. It stays until the Access backfill is verified, then goes.

---

## 7. Where rich text lands

`IRichText` and its Mongoose schema are defined in `CONTENT_EDITOR_AND_EQUATIONS.md` §8. Eleven
fields in this domain hold authored text as plain strings today. They are not all the same kind of
text, so they convert in three stages rather than one.

**Stage 1 — the four that need equations.** These are the reason the editor exists.

| Entity | Field |
| --- | --- |
| `Question` | `body` (was `question`) |
| `Question` | `options[].body` — an embedded field, not a collection (§12.3) |
| `Question` | `solution.body` — an embedded field, not a collection (§12.3) |
| `Material` | `content` |

**Stage 2 — instructions, which turn out to need equations too.** A test paper instruction routinely
carries a formula sheet or a worked example.

`TestPaper.instruction` · `TestPaperSection.instruction` · `TestPaperSection.description` ·
`TestPaperResult.instruction`

**Stage 3 — descriptions, which may not need converting at all.** `Course.description`,
`CourseModule.description`, `Plan.description`, `Meet.description`, `Subject.description`,
`Standard.description` are largely marketing and syllabus copy. Convert them when someone actually
wants formatting there; a plain string that is never going to hold an equation is not a defect.

Staging no longer rests on migration cost. There is no production data and no backward
compatibility to hold (see §10), so each of these fields is *declared* as `IRichText` rather than
expanded into it — no dual-write, no backfill, no contract step, and
`CONTENT_EDITOR_AND_EQUATIONS.md` §11 does not apply. What staging still buys is scope: Stage 1 is
the set the editor exists for, and Stage 3 is a set that may never need converting at all. A plain
string that will never hold an equation is not a defect.

Two of the Stage 1 fields — the option and solution bodies — have no wire contract to convert
*from* (§2.2), and under §12.3 they stop being separate entities altogether. They are written once,
as embedded `IRichText`, in the change that folds them into `Question`.

---

## 8. The ambiguity this plan cannot resolve for you

**Are `Material` and `Question` owned by a course, or drawn from a bank?** The schemas currently say
both, and the answer changes the language rule, the bundle rule and the migration.

- `Material` has a `course` ref *and* `standard`/`subject`/`chapter`, *and* a unique index on
  `(standard, subject, chapter, order, org)` — which only makes sense for a bank.
- `Question` has `testPaper` alongside `section`/`subsection`, which reads as owned by one paper —
  while `mergeTestPapers` shares sections between papers, which reads as a bank. §12.2 shows these
  two assumptions already return different question sets for the same paper.

Three coherent positions:

1. **Everything is a bank item.** Courses and papers reference; nothing is owned. Reuse is free,
   editing a shared question changes every paper that uses it — which is either the feature or the
   hazard, depending on whether papers are meant to be stable once published.
2. **Everything is owned.** A question belongs to one paper; reuse is a copy. Papers are stable,
   duplication is real.
3. **Bank plus copy-on-add** (my recommendation): items live in a bank, and adding one to a paper or
   module copies it. The copy keeps `sourceId` so "update from source" is possible and reporting can
   still group by origin. Stability by default, reuse when asked for.

**§12 settles the `Question` half of this.** A question becomes a pure bank item (position 1), with
only `testPaper` deleted (§12.2) — `section`, `subsection`, `marks` and `markings` all stay by
decision, so reuse is at section granularity rather than question granularity. The stability
concern that motivated position 3 does not disappear; it moves up one level, to the section, where
§12.6 handles it as an explicit **edit vs. fork** action in the authoring UI rather than as a
schema-wide copy rule. Copy-on-add at the question level is therefore not needed and should not be
built.

**What remains open is `Material`**, which has no equivalent composition layer to absorb the
decision, and the section-sharing policy of §12.6 — in particular whether `mergeTestPapers` should
go on sharing sections silently or fork them. Both need deciding before Stage 1 of §7.

---

## 9. Indexes and integrity, repo-wide

Two problems are not specific to this plan but will bite it.

**Every unique index needs a partial filter.** Everything here soft-deletes via `BaseSchema._deleted`,
and a unique index that does not exclude deleted rows rejects a legitimate re-create with a row
nobody can see. `chapter`, `material`, `standard`, `subject` and `standard-subject-mapping` now
carry `partialFilterExpression: { _deleted: false }` (with `syncIndexes()` on module init to
replace the old definitions). These still do not:

```ts
CourseModuleSchema.index({ course: 1, day: 1 }, { unique: true });
CompletedModuleSchema.index({ course: 1, courseModule: 1, collectionItem: 1, createdBy: 1 }, { unique: true });
// also: Reaction, Bookmark, Follower, Invite, Meet (meetingId), User (uid, org),
// UserStudentMapping, UserBatchMapping, StudentStandardMapping, StudentProductMapping
```

Delete day 3 and re-create it and the insert is rejected. Each needs the same partial filter, and a
duplicate that does slip through now surfaces as a 409 from `MongoDuplicateKeyFilter` rather than a
bare 500.

**Slugs are unindexed.** `Course`, `CourseModule`, `Material` and `TestPaper` all carry `slug` with
no uniqueness constraint. If slugs are public URLs they need `(org, slug)` unique — and with §4,
probably `(org, language, slug)`, since the English and Hindi courses will otherwise fight over the
same slug.

**Publishing is inconsistent.** `Course` and `TestPaper` have `isPublished`/`publishedDate`;
`Material`, `CourseModule` and `Meet` do not. A course cannot be meaningfully published if its
modules cannot be held back, so this should be uniform.

---

## 10. Delivery order

Each phase leaves the product working.

**Phase 0 — close the persistence gap (§2.1), on the shape in §12.** Nothing below is testable
until a question can be saved. **Do not build the four missing sub-entity endpoints as the client
calls them** — §12.2 shows two of them encode a relationship that is already wrong. Build instead:
`Question` with options and solution embedded and its three placement pointers stripped;
`TestPaperSection` with the one endpoint it is missing; `Question` with `order` added and
`testPaper` deleted; `CourseModule`,
which is a genuine entity and does need its endpoint. `TestPaper.upsert` and `question/upsert`
already exist and are unchanged — move the client onto them. Fix the indexes (§12.7), and replace
the empty `catch {}` in `UpsertQuestionFooter` with real error handling.

Because these contracts are being written from scratch, **write them with `IRichText` already in
place** rather than `string`; that folds Stage 1 of §7 into this phase at no extra cost and removes
the need for Phase 6 to touch the option and solution bodies at all.

**Phase 1 — integrity.** The partial filter expressions of §9, slug uniqueness, publishing
consistency. No new features; fixes live bugs and stops the later phases building on sand.

**Phase 2 — language.** `language` and `variantGroup` on `Course`, `language` on `Material`,
`TestPaper`, `Question`. Backfill everything to `'en'`. The module/course language check of §4.2.
The variant switcher in the apps.

**Phase 3 — `CourseModule` rename. Done.** Class, collection, refs,
`CompletedModule.courseModule`, and the `CourseContent` naming that had spread into the link route,
the AI content phase and the learning components. What remains of §3 is the partial index and the
`description` conversion, both of which belong to their own phases.

**Phase 4 — access.** The `Access` collection, purchase writing the bundle closure, the
reconciliation job of §6.2, read paths moved off `StudentProductMapping`, then its removal.

**Phase 5 — bundles.** Cycle and depth rules, recursive resolution, `stats` recomputation, the
progress rule of §5.4.

**Phase 6 — rich text, Stage 1, remainder.** The option and solution bodies are already done by
Phase 0, as embedded fields; what is left is `Question.body` and `Material.content`, per
`CONTENT_EDITOR_AND_EQUATIONS.md` §8. Both are declared straight as `IRichText` — §11's expand/migrate/contract does not apply to a
fresh project. `Material.content` also stops being double-encoded: it holds
`JSON.stringify(blocks)` in a `string` field today, so the value is parsed twice on every read.
Still blocked on the §8 bank-vs-owned decision.

**Phase 7 — rich text, Stages 2 and 3**, as demand appears.

---

## 11. Open questions

1. **Bank or owned (§8)?** Settled for `Question` by §12 — it becomes a bank item, with order and
   reuse set at section granularity, with `section`/`subsection`/`marks`/`markings` all kept on the
   question and only `testPaper` deleted (§12.2). Still open for `Material`, which has no composition
   layer to absorb the decision.
2. **Should a shared section be editable in place, or forked on use (§12.6)?** Editing a section
   edits every paper referencing it, and `mergeTestPapers` already shares them silently. This is the
   remaining genuine blocker for the test-paper flow: it decides what the section endpoint of
   Phase 0 does when a section is already in use.
3. **Can a plan sell a *language variant*, or the group?** Buying "Physics" in English — does that
   grant the Hindi course too? §6 assumes not (a variant is a course, access is per course), which
   means a bilingual learner buys twice. If that is wrong, the plan should reference `variantGroup`
   rather than `Course`.
4. **Does a bundled course appear as its own course in the learner's library,** or only as content
   inside the outer one? Affects navigation and whether progress shows twice.
5. **Is `Meet` scheduled per course or shared?** It hangs off both `Course.meets[]` and
   `CourseModule.meets[]` today; with bundles, a shared meet could appear twice in one view.
6. **What happens at expiry?** Read-only access to already-completed content, or a hard cut? This
   changes whether `CompletedModule` history survives a lapsed subscription.

---

## 12. Test papers, sections and questions — the composition model

> Revised 2026-09-16 across three rounds of correction from Manish. In order: sections are shared
> across papers; marks and markings stay on the question; and a question references its **section and
> subsection only, never a test paper**. This section reflects all three. Two earlier drafts —
> embedding sections in the paper, and a per-use `items[]` line item — are withdrawn and do not
> appear below.

### 12.1 Sections are already shared — the code proves it

`TestPaperService.mergeTestPapers` copies section references, not sections:

```ts
$addToSet: { sections: secondaryTestPaper.sections, … }
```

Mongoose 9 rewrites a bare array under `$addToSet` into `$each`, so those are added individually
(verified by casting the update offline — it is *not* the classic nested-array bug). The primary
paper therefore ends up holding **the secondary paper's own section `_id`s**, and one
`TestPaperSection` document is referenced by two `TestPaper`s.

Sharing is not a new requirement to design for. It is the existing behaviour, and the schema is
already almost right for it: `TestPaperSection` is a standalone collection and `TestPaper.sections[]`
is an array of references.

### 12.2 `Question.testPaper` must go

A section belongs to many papers. A question reached through that section therefore belongs to
**every** paper referencing it, and a scalar `ObjectId` has nowhere to put that. The field is
unsound by construction.

It is also, today, entirely dead. `ICreateQuestion` — the only payload that builds a question — is:

```ts
{ standard, subject?, questionType, section, subsection?, markings }
```

There is no `testPaper` in it, and a repo-wide search finds **no assignment to a question's
`testPaper` anywhere** in the teaching app, the learning app, the server or the shared package. The
schema and `QuestionDto` both declare it; nothing ever writes it.

So `question/test-paper/:testPaperId` → `find({ testPaper: testPaperId, org, _deleted })` returns
**the empty set for every paper**, always. That endpoint is not merely inconsistent with the section
path — it has never returned a question.

**Delete `testPaper` from `Question`, `QuestionDto` and the schema, and delete `findByTestPaper` and
its route with it.** The paper is reached through its sections; the question does not need to know
which papers those sections ended up in.

### 12.3 `section` and `subsection` stay, and become the only linkage

```ts
Question {
  _id, org, language
  body:      IRichText          // was `question: string`
  type:      QuestionType
  options:   [{ _id, body: IRichText, isCorrect }]   // embedded, ordered
  solution?: { body: IRichText }                     // embedded
  section:    ObjectId          // required — always the TOP-LEVEL section
  subsection?: ObjectId         // set only when the question sits in a nested subsection
  order:      number            // position within its section/subsection (§12.4)
  markings                      // the mark value lives here (§12.3.1)
  standard?, subject?, chapter?, level?, tag?, year?
}
```

Five fields are gone against today's schema: `testPaper`, `marks`, `type`, `text` and `material`.
§12.3.1 has the evidence.

Options and the solution are **embedded**, and the `Option` and `Solution` collections are deleted.
They have no independent identity, no independent lifecycle, are never read without their question,
and are bounded at four to six. That removes ~300 of the ~365 documents in a paper read, and removes
the `Question.options[]` ↔ `Option.question` pair that can disagree (§2.3-D).

#### 12.3.1 The field cull

Every field on `Question` was checked for reads and writes across the teaching and learning apps.
They fall into two groups, and only the first should be deleted.

**Dead — no reads, no writes, and no design role. Delete.**

| Field | Evidence |
| --- | --- |
| `testPaper` | never assigned anywhere; unsound besides (§12.2) |
| `marks` | `default: 0` in the schema, `marks?: number` in the DTO, zero reads — the value that actually functions as the mark is `markings.correct`, which is what `maxMarks` sums |
| `type` | bare untyped `@Prop()`; every `type:` hit in the apps belongs to `CONTENT_TYPES` on materials |
| `text` | zero reads; every hit is an unrelated component prop |
| `material` | zero reads; every hit is a `MaterialDto`/`IMaterial` prop, not `question.material` |

`marks` and `type` matter more than the rest: `marks` is a silent duplicate of `markings.correct`,
so the decision that "marks stay on the question" (§2.3-B) has to name **`markings`**, not `marks`;
and `type` overlaps `questionType`, which is the one that is actually read.

**Unused today, but part of the design. Keep.**

`subsection`, `level`, `tag` and `year` have zero reads right now — `year` is written by
`createQuestion` and never read back. They stay because they are the bank facets the model is built
around (§12.7) and the subsection linkage Manish asked for explicitly. Keeping them is a deliberate
bet on the authoring UI that has not been built yet, not an oversight — but see §12.7 for what that
means for indexing them.

**The rule that has never been written down.** `section` and `subsection` both reference
`TestPaperSection`, and today nothing says which is set when — so nothing stops them being set
inconsistently. `ICreateQuestion` already implies the answer, with `section` required and
`subsection` optional:

> **`section` is always the top-level section.** `subsection` is set *in addition*, and only when
> the question sits inside a nested subsection.

This is worth having as the stated rule rather than an accident, because it is what makes one query
sufficient: `find({ section: { $in: paper.sections } })` returns a paper's questions **including
those in subsections**, since every question carries its top-level section regardless of depth.
`subsection` then groups them for display. If `section` were instead set to the innermost container,
that query would silently miss every subsection question and the tree would have to be walked first.

Enforce it rather than trusting it — a `pre('validate')` that rejects a `subsection` which is not
listed in that `section`'s `subsections[]` costs one lookup on a write path that is already rare.

### 12.4 Ordering: the one cost of pointing this direction

A pointer from child to parent gives you the set, never the sequence. So ordering needs an explicit
`order: number` on `Question` — this is the one place where this direction costs something that an
ordered array on the section would have given free.

- `order` is the position **within `subsection` when set, otherwise within `section`**.
- Index `{ section: 1, order: 1 }` — the sort is then served by the index, with no in-memory sort.
- Reordering renumbers the affected container's questions in one `bulkWrite`. A section holds tens
  of questions, not thousands, and reordering is an authoring action, not a read path. Space the
  values (10, 20, 30…) if single-insert renumbering ever shows up as a real cost; do not reach for
  fractional ordering unless it does.

Without this field the order is whatever the storage engine returns, which is §2.3-C and is the
defect most likely to be noticed by a student rather than a developer.

**The trade to accept knowingly:** a scalar `section` means **a question lives in exactly one
section**. Reuse happens at the section level — share the section, and every paper referencing it
gets its questions — not at the question level. Putting the same question in two different sections
means two question documents. That follows directly from pointing this way, and it is coherent with
§12.1, where the section is already the unit of sharing. If question-level reuse is ever wanted, the
change is to move the linkage onto the section as an ordered array; it is not a small change, so it
is worth being sure now.

### 12.5 The paper, and what a read costs

`TestPaper` keeps `sections: [ObjectId]` exactly as today (ordered by array position), drops
`totalMarks`, `duration` and `type` (§2.3-H), moves the survivors under `totals`, and converts
`instruction` to `IRichText`.

Reading one paper:

1. `TestPaper.findOne({_id, org})` → `sections[]`
2. `TestPaperSection.find({_id: {$in: sections}})` → names, instructions, `defaultMarkings`, `subsections[]`
3. `Question.find({section: {$in: sections}}).sort({section: 1, order: 1})` → every question, options and solution included, in order

Steps 2 and 3 are independent and issue in parallel (`Promise.all`), so this is **two round trips of
latency across three queries**.

| | Documents | Collections | Grows with paper size? |
| --- | --- | --- | --- |
| Today | ~365 | 5 | yes |
| Proposed | 1 + sections + questions | 3 | **no** |

Step 1 gives the section order (array position); step 3 gives the question order (the `order` field,
served by the index). `$in` does not return documents in the order of the array, so **section order
comes from `sections[]`, not from the result of step 2** — the array is the ordering authority, the
query result is a lookup table.

**The paper stores no questions — only counts of them, and those are computed in the wrong place.**
There is no question array on `TestPaper` and there should not be one: the path is paper →
`sections[]` → questions via the `section` pointer, and a question list on the paper would be a
third copy of a relationship that already has one direction (§2.3-D). But `totalQuestions` and
`maxMarks` *are* derived question data, and today they are produced like this, in the client:

```ts
// apps/teaching/src/stores/test-paper.store.ts
const questions = useQuestionStore.getState().getQuestionsBySectionIds(testPaper.sections ?? []);
const maxMarks = questions.reduce((t, q) => t + (q.markings?.correct ?? 0), 0);
patchTestPaper(testPaperId, { totalQuestions: questions.length, maxMarks });
```

Two problems, both created by shared sections:

- **No fan-out.** Adding a question to a shared section updates the totals of *the paper that
  happens to be open*. Every other paper referencing that section keeps a stale count, silently and
  indefinitely. The client cannot fix this — it does not know which other papers reference the
  section.
- **It counts what is loaded, not what exists.** `getQuestionsBySectionIds` reads the Zustand store,
  so the total is a function of what has been fetched. The server then accepts the numbers verbatim:
  `updateTotalQuestionsAndMarks(org, id, totalQuestions, maxMarks)` writes whatever it is handed.

**The fix: one server-side aggregation, fanned out over every affected paper** (agreed with Manish,
2026-09-16). The counters stay — the papers-list screen needs them without aggregating over
questions — but nothing outside the server ever computes them. On any write that can change a
total (a question created, deleted, moved between sections, or its `markings` edited; a section
added to or removed from a paper):

```ts
// 1. every paper affected — served by TestPaperSchema.index({ sections: 1 })
const papers = await this.testPaperModel
  .find({ sections: sectionId, org, _deleted: { $ne: true } })
  .select('_id sections')
  .lean();

// 2. count and sum once per section — $match is served by { section: 1, order: 1 }
const sectionIds = [...new Set(papers.flatMap((p) => p.sections))];
const perSection = await this.questionModel.aggregate([
  { $match: { section: { $in: sectionIds }, _deleted: { $ne: true } } },
  { $group: { _id: '$section', count: { $sum: 1 }, marks: { $sum: '$markings.correct' } } },
]);

// 3. fold per paper and write back in one round trip
const bySection = new Map(perSection.map((r) => [String(r._id), r]));
await this.testPaperModel.bulkWrite(
  papers.map((p) => {
    const t = p.sections.reduce(
      (acc, id) => {
        const r = bySection.get(String(id));
        return r ? { q: acc.q + r.count, m: acc.m + r.marks } : acc;
      },
      { q: 0, m: 0 },
    );
    return {
      updateOne: {
        filter: { _id: p._id, org },
        update: { $set: { totalQuestions: t.q, maxMarks: t.m } },
      },
    };
  }),
);
```

Three round trips, both queries index-backed, and the whole fan-out in one `bulkWrite`. Note the
aggregation deliberately groups by `section` rather than joining papers to questions with a
`$lookup` sub-pipeline: a `$lookup` correlating on `$expr: { $in: ['$section', '$$sectionIds'] }`
does not use `{ section: 1, order: 1 }`, so it would scan. Grouping by section keeps the `$match`
on a plain indexed equality and makes the per-paper fold ordinary application code.

**`updateTotalQuestionsAndMarks` stops taking numbers.** Its signature today is
`(org, testPaperId, totalQuestions, maxMarks)` — it writes whatever the client hands it. It becomes
`(org, sectionId)` and derives both. A value the server can compute is not a value a client should
be able to assert.

### 12.6 The decision sharing forces you to make explicit

A shared section means **editing a section edits every paper that uses it** — and now, because
questions hang off the section, adding a question to it adds that question to every paper
referencing it. Sometimes that is exactly right (a maintained section reused across a series);
sometimes it is a surprise (you merged B into A six months ago, edit A, and B silently changes).

The schema cannot decide this, but the product must, and it needs to be visible rather than implied:

- Show the section's reuse count wherever a section is edited — "used in 4 papers".
- Make **edit** and **fork** two distinct actions. Fork copies the section *and its questions*
  (since a question belongs to one section, §12.4) and swaps the reference in this paper only.
- Decide whether `mergeTestPapers` should share or fork. Today it shares, silently. Forking on
  merge is the more defensible default; sharing is the more useful one when deliberate.

The same applies one level down to `Question.marks`, which is now bank-wide by decision (§2.3-B):
editing what a question is worth changes every paper that uses it, and the authoring UI should say
so at the point of edit.

### 12.7 Indexes

```ts
// composition — this is the hot read path (§12.5 step 3)
QuestionSchema.index({ section: 1, order: 1 });                 // serves the sort; replaces {section: 1}
QuestionSchema.index({ org: 1, _deleted: 1 });                  // was missing entirely

// bank search — build with the bank UI, not before (see note)
QuestionSchema.index({ org: 1, standard: 1, subject: 1, chapter: 1, _deleted: 1 });
QuestionSchema.index({ org: 1, level: 1, tag: 1, _deleted: 1 });

TestPaperSectionSchema.index({ org: 1, _deleted: 1 });
TestPaperSchema.index({ org: 1, _deleted: 1 });
TestPaperSchema.index({ sections: 1 });                         // "which papers use this section?"
```

Deleted: `{standard: 1}` (not org-scoped), `{section: 1}` and `{section: 1, _deleted: 1}` (both
subsumed by `{section: 1, order: 1}`, which serves the same equality predicate *and* the sort).

**The two bank-search indexes are speculative and should not ship with Phase 0.** `level` and `tag`
have zero reads today (§12.3.1), and `standard`/`subject`/`chapter` are read for display rather than
queried. An index costs write throughput on every question write and buys nothing until a query
uses it. Add each one with the screen that searches the bank; the two hot-path indexes above it —
`{section: 1, order: 1}` and `{org: 1, _deleted: 1}` — are the ones Phase 0 actually needs.

Per §9, prefer a partial filter expression for `_deleted` over carrying it as a trailing index key,
since every query is `_deleted: {$ne: true}`.

### 12.8 The frontend falls out of this

`question.store.ts` keeps `questionMap`, `optionMap` and `solutionMap` as three parallel keyed
stores, with `createOption`, `upsertSolution`, `getNewOptions`, `getNewSolutions`, `getOptionsByIds`
and `removeOptionById` existing only to reassemble what the server took apart. **Options and
solutions stop being store entities** — they are fields on a question, patched through the existing
`patchQuestion`. Roughly half that store is deleted rather than rewritten.

`getQuestionsBySectionId` and `getQuestionsBySectionIds` already select on `question.section`, so
they survive this change unaltered — they just need to sort by `order`.

Three endpoints replace the four that do not exist:

| | |
| --- | --- |
| `POST question/upsert` | one question, options and solution included — **already implemented** |
| `POST test-paper/section/upsert` | one section — the only genuinely new endpoint |
| `POST test-paper/upsert` | the paper and its ordered `sections[]` — **already implemented** |

`question/upsert` is the endpoint §2.1 found nothing calling; under this model it becomes the right
call, which removes the two-intended-shapes problem by deleting the second shape.

### 12.9 Consequence for §10

Phase 0 becomes: embed options and solution into `Question` and delete those two collections; delete
`Question.testPaper` and `findByTestPaper` with its route; add `order` and enforce the
section/subsection rule; give `TestPaperSection` its one missing endpoint; fix the indexes; declare
every content field as `IRichText` from the start; delete the five dead `Question` fields —
`testPaper`, `marks`, `type`, `text`, `material` (§12.3.1) — and move the
`totalQuestions`/`maxMarks` computation into the server-side aggregation of §12.5, changing
`updateTotalQuestionsAndMarks(org, id, totalQuestions, maxMarks)` to `(org, sectionId)`. `markings`
stays on `Question` untouched. Ship only the two hot-path indexes; leave bank search unindexed until
the bank UI exists (§12.7). `TestPaper.upsert` and `question/upsert` already exist and are unchanged. `CourseModule`
still needs its own endpoint and is unaffected by any of this.
