# AI Course Generator — Plan

Status: Phases 1–4 built 2026-09-20 (see `apps/teaching/src/utils/ai/COURSE_GENERATOR.md`, which also lists the deviations). The generation core has moved to `@repo/shared/ai`, and a terminal agent (`.claude/agents/course-builder.md` with `tools/course-agent/cli.mjs`) runs the whole pipeline as the model — the internal precursor of Phase 5, which remains blocked on provider credentials and a job model. Phase 6 unsized. Builds on the two generators that already ship in the teaching
app — test papers (`apps/teaching/src/utils/ai/test-paper-generator.ts`) and study material
(`study-material-generator.ts`) — and on the course domain described in
`COURSE_PLATFORM_STRUCTURE.md`. Read those first; this document only adds what a _course_ needs.

## 0. What a course is, and what "generate a course" therefore means

```
Course            name, description, thumbnail (attachment), standards[], subjects[], isPublished
  ├── Plan[]      name, amount, realAmount, period (monthly | yearly | …), currency
  └── CourseModule (day 1..N)
        ├── materials[]  → Material   (a lesson: IRichText content, level, durationMins, attachments)
        ├── testPapers[] → TestPaper  (sections → questions)
        └── meets[]      → Meet       (a live session: start, duration, frequency, week days)
```

So a generated course is **a plan of days**, each day pointing at lessons, tests and sessions that
either already exist in the workspace or are generated for it. The two content generators already
produce lessons and tests from a prompt; what is missing is the layer above them — the syllabus
turned into a day-by-day structure, the fan-out of one course into many generation jobs, the
linking of what comes back into the right module, and the review of the whole.

Three principles carry over unchanged from the existing generators, and every phase below obeys
them:

1. **The app writes the prompt; a model the teacher chooses answers; the app validates and
   imports.** No provider keys in the app until Phase 5, and even then the copy-and-paste path
   stays as the fallback.
2. **Ids travel through the JSON.** The prompt lists workspace ids; the reply echoes them; the
   importer never matches by name. A reply for the wrong course, standard or module is refused.
3. **Nothing is saved until the import, and an import is all-or-nothing per request.** Bulk
   routes, client-minted `_id`s so a retry is idempotent, and rollback of anything created before
   a later step fails.

## 1. Phases at a glance

| Phase | Delivers                                                                                                                                                                 | Depends on                                      | Size      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | --------- |
| 1     | **Course blueprint**: syllabus → named course, description, day-by-day modules, plans; links _existing_ lessons and tests by id                                          | nothing new on the server beyond one bulk route | 4–5 days  |
| 2     | **Fill the modules**: a generation queue that turns each module's lesson and test specs into the existing generators' prompts, and links what comes back into the module | Phase 1; small extensions to both generators    | 5–6 days  |
| 3     | **Sessions and cover**: live-session schedule from the blueprint; a course cover image                                                                                   | Phase 1; the calendar's frequency table         | 2–3 days  |
| 4     | **Review**: coverage matrix, coherence check, learner-readiness report before publishing                                                                                 | Phases 1–2                                      | 3 days    |
| 5     | **Automation**: the same prompts run server-side against a configured provider, as jobs with progress and cost                                                           | Phases 1–4 stable                               | 6–8 days  |
| 6     | **Learner enrichments** (later): flashcards from key terms, revision schedule, per-module quizzes                                                                        | Phase 2                                         | not sized |

Phases 1–4 are all client-side plus two or three bulk routes, which is the same shape as the
generators already shipped. Phase 5 is the first time the server talks to a model.

## 2. Phase 1 — Course blueprint

### 2.1 Entry point and steps

**Generate with AI** on `/courses` (list header and empty state), and **Plan with AI** on an
empty course page. The drawer follows the shared three-step shape (`AiSteps`, `AiPromptStep`,
`AiDrawerFooter` in `apps/teaching/src/components/app/ai/`):

1. **Setup** — standards (one or more), subjects (optional), course length as _weeks_ and _study
   days per week_ (defaults: 8 weeks, 5 days), pace (light / standard / intensive → minutes per
   day: 45 / 75 / 120), exam style, language, what each day may contain (lessons, a quiz, a live
   session), pricing hint (free / paid with a suggested monthly and yearly amount), free text. The
   step shows what will be created: N modules across W weeks, with the expected mix.
2. **Prompt** — built by `buildCourseBlueprintPrompt`. It carries the workspace data the model
   must reuse: standards, subjects, chapters with ids, **and the org's existing lessons and test
   papers for those standards and subjects** (id, name, level, durationMins, chapter, tag). The
   model is told to research the official syllabus first, then lay the topics across the days in
   teaching order, and to _reuse an existing lesson or test by id wherever one fits_ rather than
   asking for a new one.
3. **Import** — paste or upload the reply; validate; preview the course as a week-by-week grid;
   import.

### 2.2 The contract: `acadimic.course/v1`

Lives in `packages/shared/src/interfaces/ai-course.interface.ts`, next to the other two.

```ts
interface IAiCourse {
  format: 'acadimic.course/v1';
  courseId: string; // minted by the drawer, echoed back
  standards: string[];
  subjects: string[];
  title: string;
  tagline: string; // tagline ≤ 120 chars, for the card
  description: string; // Markdown, 150–300 words: who it is for, what they will be able to do
  outcomes: string[]; // 5–8 "can do" statements
  prerequisites: string[];
  outline: string[]; // the syllabus the model worked from, in teaching order
  weeks: Array<{
    ref: string; // "W1"
    theme: string;
    days: Array<{
      ref: string; // "W1-D1" → module.day is assigned at import
      name: string;
      description: string; // one or two sentences shown on the module card
      topics: string[];
      estimatedMins: number;
      lessons: Array<
        | { use: string } // an existing Material id
        | { generate: { name: string; level: LevelType; topics: string[]; durationMins: number; chapter?: string } }
      >;
      tests: Array<
        | { use: string } // an existing TestPaper id
        | {
            generate: {
              name: string;
              questionCount: number;
              chapters: string[];
              topics: string[];
              durationMins: number;
            };
          }
      >;
      session?: { title: string; durationMins: number; agenda: string[] };
    }>;
  }>;
  plans: Array<{
    name: string;
    period: 'monthly' | 'yearly';
    amount: number;
    realAmount: number;
    currency: 'INR' | 'USD';
  }>;
  generatedBy?: string;
}
```

Design notes:

- `use` / `generate` is the reuse mechanism. The validator checks every `use` id against the
  workspace lists it was given; an unknown id is an error, a `generate` spec is what Phase 2 runs.
- Weeks are a _presentation_ grouping; the database only has `CourseModule.day`. The importer
  numbers days 1..N across weeks. `theme` goes into the module description prefix (`Week 1 —
Forces: …`) until a `week` field exists on the module (see §2.4).
- `estimatedMins` per day lets the setup step's pace be checked: a day far over the pace is a
  warning.
- Plans are suggestions the teacher edits; the amounts are shown in the preview with a note that
  nothing is charged until the course is published.

### 2.3 Validation (client, `validateAiCourse`)

Errors: wrong `courseId`, standards or subjects not in the setup; an unknown `use` id; a day with
neither lessons nor tests nor a session; duplicate refs; a `generate` lesson with no topics; a
plan with a non-positive amount or unknown period.
Warnings: a day over the pace by more than 50 %; an outline line no day covers (coverage); a
lesson level ladder that goes backwards within a week; a description under 100 words; more than
one session per day; a `use` of the same lesson in two days.

### 2.4 Import

1. Create the `Course` from the reply (name, description → stored as plain text today; the
   Markdown is kept in `description` since the card shows plain text), standards, subjects,
   `isPublished: false`, `tag: 'ai_generated'`.
2. Create `Plan`s.
3. Create one `CourseModule` per day, in order, with `materials`/`testPapers` set to the `use`
   ids. Every `generate` spec is stored on the module as _pending work_ (§2.5).
4. Write through **new `POST course/bulk-upsert-modules`** (`BulkUpsertCourseModulesDto`, max 120) after `POST course/upsert/course/plans`. On failure after the course is written, the
   course and its plans are soft-deleted, so nothing half-made stays on the list.
5. Open the course page.

Schema additions (small, additive):

| Entity         | Field                                                                   | Why                                                                     |
| -------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `CourseModule` | `topics?: string[]`                                                     | shown on the card; the coverage matrix in Phase 4 reads it              |
| `CourseModule` | `week?: number`                                                         | so the grid does not have to be re-derived from `day` and the pace      |
| `CourseModule` | `pending?: IAiPendingWork[]`                                            | the `generate` specs not yet fulfilled (§2.5); cleared as they are      |
| `Course`       | `outline?: string[]`, `outcomes?: string[]`, `prerequisites?: string[]` | the course page's "About" block; the review phase compares against them |

### 2.5 Pending work

```ts
interface IAiPendingWork {
  key: string;                            // minted at import
  kind: 'lesson' | 'test';
  spec: IAiCourse['weeks'][0]['days'][0]['lessons'][0]['generate'] | …tests…;
  status: 'pending' | 'prompted' | 'done' | 'skipped';
  createdId?: string;                     // the Material / TestPaper once it exists
}
```

Stored on the module so a teacher can close the drawer, come back next week, and see exactly what
is still to be generated. Phase 2 consumes it.

### 2.6 UI on the course page after import

The module card shows its topics, its linked content, and a **"2 lessons and 1 quiz to
generate"** chip. The course header gets a progress line: _14 of 22 items generated_. Nothing
about the learner-facing rendering changes in this phase.

### 2.7 Acceptance

- A blueprint for two standards and three subjects imports in one go and appears as a course with
  the right number of modules, each with the right `use` links.
- A reply that invents a lesson id, or names a subject the setup did not pick, is refused with
  the ref that is wrong.
- Cancelling or a failing module write leaves no course on the list.
- Playwright run: setup → prompt → import from a fixture → course page → delete.

## 3. Phase 2 — Fill the modules

### 3.1 The generation queue

A **Generate content** panel on the course page lists every `pending` item across modules,
grouped by module, each with the status above. Two ways to work through it:

- **One at a time.** Click an item → the existing drawer opens (study material or test paper)
  pre-filled from the spec, with the module context attached. Import links the result into the
  module and marks the item done.
- **Batch per kind.** "Write all lesson prompts" produces one study-material prompt per module
  (all that module's `generate` lessons in one reply, as one graded mini-set), using the prompt
  pack step from the whole-standard drawer (`AiPromptPackStep`). "Write all quiz prompts" does the
  same with the test paper builder. Replies are added to one import step, matched to modules by
  the ids they carry, and imported together.

### 3.2 Extensions to the two generators

Both are small and backward compatible:

| Generator      | Change                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Study material | `IAiMaterialSetup` gains `lessons?: Array<{ ref; name; level; topics; durationMins }>` — an explicit lesson list that overrides the ladder. The prompt then says "write exactly these lessons" and the reply's `materials[].ref` must match. `IAiStudyMaterial` gains optional `courseModule: string`; the importer links the created materials into that module and clears the pending items by `ref`. |
| Test paper     | `IAiBlueprint` gains optional `courseModule`; `IAiTestPaper` echoes it. The whole-paper drawer's planning (`test-paper-plan.ts`) takes the spec's `questionCount`, `chapters`, `topics` and `durationMins`. Import links the paper into the module.                                                                                                                                                     |
| Both           | A `source` field on the created row: `{ kind: 'ai', course, courseModule, ref, generatedBy }` — provenance, so the review phase and any later regeneration know where a lesson came from. Stored as `Material.source` / `TestPaper.source`, optional.                                                                                                                                                   |

### 3.3 Server

- `POST material/bulk-upsert` and `POST question/bulk-upsert` exist. Add **`POST
course/link-module`**: `{ courseModule, materials?: string[], testPapers?: string[], clearPending?:
string[] }` — one small idempotent write that appends links and clears pending keys, so linking
  never has to re-send the whole module and cannot race with a concurrent edit of its name.
- Course stats recompute after a link (the existing `calculateAndSetCourseStatsByCourseId` on the
  client, then the server's roll-up).

### 3.4 Acceptance

- From a Phase 1 course with 10 pending lessons and 4 pending quizzes, the batch path produces 10
  lesson prompts and 4 quiz prompts; importing the fixtures links everything and the progress line
  reads _14 of 14_.
- A lesson reply whose `courseModule` is another course's is refused.
- Re-importing the same reply replaces, not duplicates (same client-minted ids by `ref` while the
  pending item is open).

## 4. Phase 3 — Sessions and cover

### 4.1 Live sessions

Each day's `session` spec becomes a `Meet`. The teacher picks a start date, a time slot and which
week days are teaching days (defaults from the setup's days per week); the drawer lays the sessions
across the calendar in day order using `MEET_FREQUENCIES` and `getFullCalendarEvents`, shows the
resulting schedule on a small month grid (reuse the calendar's read-only pieces), and creates the
meets with `POST meet/bulk-upsert` (new, mirrors the others). The agenda becomes the meet
description. Meets are linked into `Course.meets` and the module's `meets[]`.

### 4.2 Cover image

Models the teacher pastes into cannot return an image through JSON, so two options, both cheap:

1. **Generated cover** (default): a deterministic SVG from the course name and subject — a palette
   picked from the subject, the title set in the app's type, a subtle geometric pattern seeded by
   the course id. Rendered to PNG in the browser (`canvas`), uploaded through the existing
   `uploadFilesToS3` at save, stored as the course's attachment. Always available, on brand, no
   provider.
2. **Image-model prompt**: the Prompt step also offers a one-paragraph image prompt (subject,
   mood, no text) the teacher can paste into any image model, then drop the PNG on the cover
   dropzone. The dropzone already exists.

### 4.3 Acceptance

- Eight weeks × two sessions per week produce sixteen meets on the right dates, visible on
  `/calender` and the course page.
- A course imported without a cover shows the generated one; replacing it works through the
  existing course form.

## 5. Phase 4 — Review before publishing

All local computation plus one optional prompt.

- **Coverage matrix**: `Course.outline` lines against module `topics` and the linked lessons'
  `topics`/`keyTerms`. Uncovered lines and topics covered twice are listed.
- **Pace check**: sum of linked content minutes per day versus the pace; over and under days
  flagged.
- **Ladder check**: lesson levels per week should not go backwards.
- **Dead references**: the link checker (`POST common/verify-links`) is run across every linked
  lesson's attachments; broken ones reported with the lesson to fix.
- **Coherence review (prompt)**: a compact digest of the course (outline, per-day names, topics,
  lesson titles and key terms, quiz blueprints) is written as a prompt; the model returns
  `acadimic.course-review/v1` — a list of `{ severity, where (day ref), issue, suggestion }`.
  Shown as the same issue list the importers use. Nothing is written; the teacher acts on it.
- **Publish gate**: the course form's Publish toggle shows the review summary; errors (dead
  links, empty days) block publishing, warnings do not.

## 6. Phase 5 — Automation

The step where the server runs the prompts, so a teacher clicks _Generate_ and waits.

- **`GenerationJob` collection**: `{ org, course, kind: 'blueprint' | 'lessons' | 'test' | 'review', input (the same setup objects), prompt, provider, model, status, progress, output (raw), parsed, issues, cost: { inputTokens, outputTokens, usd }, error, createdBy }`. Every job is
  reproducible from `input` alone.
- **Provider adapters** behind one interface (`complete(prompt, { model, maxTokens, tools:
['web_search'] })`): Anthropic, OpenAI, Gemini, keyed by `AI_*` secrets in `secrets.ts`, with
  per-org monthly caps. Web search comes from the provider's tool where offered; otherwise the
  job is marked _no research_ and the review phase weighs references lower.
- **The same builders and validators**, moved to `packages/shared/src/ai/` so client and server
  share them byte for byte (they are pure functions already; only `getObjectId` needs an
  injected id source). The importers on the server reuse the bulk services.
- **Runner**: one job at a time per org, started from the queue, streamed progress over SSE
  (`GET generation/jobs/:id/events`), retries with the validator's issues fed back as a
  correction prompt at most twice, then the job stops with the issues for a human.
- **UI**: every drawer's Prompt step gains a **Run for me** button beside Copy; the Import step
  fills itself when the job lands. The manual path remains and is what the fallback uses when a
  provider is down or the cap is reached.
- **Cost display** per job and per course; an estimate before running from the prompt length and
  the planned reply size.

## 7. Phase 6 — Learner enrichments (later, not sized)

- Flashcards from every lesson's `keyTerms` as a new material type, with the learning app's
  spaced repetition.
- A revision schedule generated from the course's ladder and the learner's test results.
- Adaptive per-module quizzes drawn from the question bank by tag and level.

## 8. Cross-cutting decisions

- **Where the code lives**: prompt builders, parsers, validators and importers in
  `apps/teaching/src/utils/ai/course-generator.ts` and `course-review.ts` for Phases 1–4, moved to
  `packages/shared/src/ai/` in Phase 5. UI in `apps/teaching/src/modules/courses/components/ai/`.
  Shared step components stay in `apps/teaching/src/components/app/ai/`.
- **Reply size**: a blueprint for eight weeks is ~40 days × a few lines each — comfortably one
  reply. Lesson content is never in the blueprint; it comes through the module-level prompts,
  which is what keeps every reply within a model's output limit.
- **Idempotency**: every created row's `_id` is minted client-side and kept while its pending item
  is open, so a retried import overwrites rather than duplicates.
- **Provenance**: `source` on generated rows and `tag: 'ai_generated'` on the course, so AI-made
  content can be listed, reviewed and, if needed, removed in one filter.
- **What the teacher always sees**: the preview before import, the issues list, and the progress
  line. The system never publishes anything by itself.

## 9. Order of work

1. Phase 1 contract, builder, validator, importer, drawer, bulk-modules route, Playwright run.
2. Phase 2 pending-work storage, generator extensions, link-module route, queue panel.
3. Phase 3 sessions and generated cover.
4. Phase 4 local checks, review prompt, publish gate.
5. Phase 5 only once 1–4 have been used on real courses for a few weeks, so the job model
   encodes what teachers actually do rather than what we guessed.
