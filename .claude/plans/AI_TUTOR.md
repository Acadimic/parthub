# Ask AI — a tutor for students in the learning app

Plan, 2026-10-08. Two entry points, one backend:

1. **Ask about a selection** — the student selects lines in a lesson, a small "Ask AI" button
   appears, and they ask about exactly that passage.
2. **Ask about a module** — an "Ask AI" tab beside "Discussion" in the course outline, where the
   student chats about the whole module (one day/chapter) they are on.

Answers come from **open-weight models** (Qwen, Llama, Gemma; the weights are published on
Hugging Face), called **only from the server**. This is the first place the platform calls a model
at runtime. Everything else still follows the paste-in rule (`CLAUDE.md`, teaching → AI generation),
and this exception is deliberate: a student cannot be asked to paste a prompt into ChatGPT.

---

## 1. Who may serve the answers: learners include under-18s

The learner base is **mixed: adults and school students under 18** (Manish, 2026-10-08). That
rules providers in or out before price does.

| Provider                                     | Under-18 end users                                                                                                                                                       | Verdict                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| **Gemini API** (AI Studio, incl. Pro credits) | Terms forbid use in a service "directed towards or likely to be accessed by individuals under the age of 18".                                                           | **Out.** Routing only adults to it doesn't help, because the clause is about the app as a whole. |
| **Vertex AI (Gemini on Google Cloud)**        | Cloud's Service Specific Terms carry the same clause for every Generative AI Service.                                                                                   | **Out**, unless Google confirms otherwise in writing. |
| **Groq, OpenRouter**                          | Both require users to be 18+. OpenRouter raised its minimum from 13 to 18 on 2026-08-31.                                                                                 | **Out** for this app.                         |
| **HF Inference Providers (router)**           | HF's own minimum is 13, but the router forwards each call to a third-party host (Together, Fireworks, …) under that host's terms, which vary.                             | **Dev only.** Fine to build and test with; not the production primary. |
| **Self-hosted open model**                    | Only the model licence applies. Qwen2.5 is Apache-2.0, with no age clause.                                                                                              | **Production primary.**                       |

Self-hosting options, cheapest first. All of them speak the OpenAI-compatible
`/v1/chat/completions` protocol:

1. **HF Inference Endpoints (dedicated)**. HF runs the model on a GPU reserved for you, under HF's
   terms only. Billed per hour, with scale-to-zero when idle, so there is no bill overnight. The
   trade-off is a cold start of about a minute after idle.
2. **A GPU VM on the cloud we already deploy to**, running vLLM or Ollama. Always on, so it costs
   more, but there is no cold start.
3. **CPU only** (Ollama, a 4-bit 3B–7B model on the server box). Free, but slow, at roughly
   5–15 tokens/s. Acceptable for a pilot class, not for many concurrent learners.

**Decision this plan takes:** the server talks to _a list of endpoints_ read from env and falls back
down the list on 402 (credits exhausted), 429 (rate-limited), 5xx or timeout. That list is what
"based on availability" means here. In **dev**, the list is the HF router. In **production**, it
holds only providers cleared for under-18 use: the self-hosted endpoint first, and a second
self-hosted replica or smaller model as fallback. Changing the list is an env change, not a code
change.

Models: `Qwen/Qwen2.5-7B-Instruct` is primary. It is Apache-2.0, strong on maths, and multilingual,
which matters for the Hindi, Sanskrit and Spanish courses. `Qwen/Qwen2.5-3B-Instruct` is the
CPU or fallback model.

This is a reading of the providers' published terms, not legal advice. If Gemini matters enough,
ask Google for written confirmation for an education app with under-18 learners. Until then it
stays out.

---

## 2. Shape of the feature

```
 LEARNING APP                                   SERVER (new module ai-tutor)              PROVIDERS
 ────────────                                   ─────────────────────────────             ─────────
 select text in RichTextView ─► [Ask AI] ─┐
                                          ├─► POST ai-tutor/ask-selection  ─┐
 "Ask AI" tab in CourseOutline ───────────┘   POST ai-tutor/ask-module     ─┤
                                                                            ├─ check access to course
                                                                            ├─ check + count daily quota
                                                                            ├─ load context from Mongo
                                                                            │   (material.content.text,
                                                                            │    never trusted from client)
                                                                            ├─ build prompt (shared)
                                                                            └─ call endpoint list ──► HF router
                                                                                 with fallback   ──► fallback(s)
 answer Markdown ◄── richTextFromMarkdown ◄── { answer, model } ◄──────────────
 rendered with RichTextView (LaTeX works)
```

---

## 3. Decisions (Manish, 2026-10-08)

| Question                 | Decision                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Several HF accounts      | **No.** Spreading load over extra free accounts to dodge the limit breaks HF's terms and risks the token being banned mid-class. Scale through the endpoint list (§1) instead. |
| Gemini (Pro accounts)    | **Not used.** Learners are a mix that includes under-18s, and both the Gemini API and Vertex AI terms forbid that (§1). Pooling several Pro accounts would also break Google's quota rules. |
| Limits                   | Set in §5. They are env values, so they can be tuned without a deploy of code.                                                                             |
| Quiz-style questions     | **Hint plus answer, for every reply.** The learner sees the hint first and opens the full answer with one tap.                                              |
| History                  | **Kept**, and **teachers can read** their learners' threads. The learner is told so beside the composer.                                                   |

---

## 4. Data contracts (`packages/shared`)

Two ways to start a thread (selection and module need different context), one way to continue it.

```ts
// enums
enum AiThreadKind { SELECTION = 'selection', MODULE = 'module' }
enum AiTurnRole   { LEARNER = 'learner', TUTOR = 'tutor' }

// dtos/validations/ai-tutor/
class StartSelectionThreadDto { courseId; courseModuleId; materialId; selection: string; question: string }
class StartModuleThreadDto    { courseId; courseModuleId; question: string }
class AskInThreadDto          { question: string }

// interfaces/ai-tutor.interface.ts
interface ILearnerTurn { role: AiTurnRole.LEARNER; question: string; askedAt: string }
interface ITutorTurn   { role: AiTurnRole.TUTOR; hint: string; answer: string; model: string; answeredAt: string }
type     IAiTurn = ILearnerTurn | ITutorTurn

interface IAiThreadBase { id; courseId; courseModuleId; turns: IAiTurn[]; updatedAt: string }
interface ISelectionThread extends IAiThreadBase { kind: AiThreadKind.SELECTION; materialId: string; selection: string }
interface IModuleThread    extends IAiThreadBase { kind: AiThreadKind.MODULE }
type     IAiThread = ISelectionThread | IModuleThread

interface IAiUsage { remainingToday: number; enabled: boolean }
```

- The client never sends history or lesson content. The server loads the thread's turns and the
  material text itself, so nobody can turn the endpoint into a free general-purpose chatbot by
  posting arbitrary "context".
- **Hint plus answer.** The prompt tells the model to reply in two marked sections, `### Hint` and
  `### Answer`. `splitHintAnswer` in shared parses them. If the model ignores the markers, the hint
  is the first paragraph and the answer is the rest, so both fields are always filled and no empty
  sentinel exists.

Prompt builders go in `packages/shared/src/ai/tutor/`, beside the existing generators:
`buildSelectionPrompt`, `buildModulePrompt`, `splitHintAnswer`, and `fitToBudget(text, maxChars)`.
`fitToBudget` trims module context by whole materials first, then by paragraph. They work from
`IRichText.text` (plain text with LaTeX already in it), so the server doesn't need `docToMarkdown`
from `@repo/ui`.

System prompt essentials:

- You are a tutor for _<course name>_, module _<module name>_.
- Answer from the given material. Say so when the material doesn't cover the question.
- Always reply as `### Hint` (one or two sentences that point the way without giving the result),
  then `### Answer` (the full step-by-step explanation or solution).
- Pitch it at the learner's level. Use `$…$` for maths.
- Politely decline anything unrelated to the course, with the hint section saying so.

---

## 5. Limits

| Limit                                  | Value                       | Why                                                                                         |
| -------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| Questions per learner per day          | **15** (`AI_TUTOR_DAILY_LIMIT`) | Real use for a study session. On a self-hosted endpoint this protects GPU time rather than credits. |
| Questions per organisation per month   | **2 000** (`AI_TUTOR_ORG_MONTHLY_LIMIT`) | A hard stop, so one busy org cannot drain the credits every other org relies on.             |
| Cooldown between questions             | **5 s** per learner         | Stops double-submits and scripted loops. No new dependency is needed: check `lastAskedAt` on the usage row. |
| Selected text                          | **1 500 chars** (~2 paragraphs) | Longer than that, the module tab is the right tool.                                       |
| Question                               | **500 chars**               |                                                                                             |
| Turns sent to the model                | last **6**                  | Keeps prompts small. The full thread is still stored and shown.                             |
| Turns per thread                       | **30**, then "start a new thread" | Bounds the document size and the prompt.                                                    |
| Module context                         | **12 000 chars** (~3k tokens) | Fits every 7–8B model's window with room for the answer.                                  |
| Answer length                          | `max_tokens` **700**        | Covers the hint plus a worked answer.                                                       |
| Provider timeout                       | **30 s** per endpoint       | After that, fall back to the next endpoint.                                                 |

A question counts only once it has been answered, so a provider failure never costs the learner one.
Hitting a daily or monthly limit returns 429 with a message saying when it resets.

---

## 6. Server — `apps/server/src/modules/ai-tutor/`

Follow `add-server-module` and `query-with-mongoose`, and use `course-comment/` as the template.

| File                     | Holds                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-tutor.controller.ts` | Learner: `POST thread/selection`, `POST thread/module`, `POST thread/:id/ask`, `GET threads/module/:courseModuleId`, `GET thread/:id`, `POST thread/:id/remove`, `GET usage`. Teacher: `GET course/:courseId/threads` (paged, filter by module or learner). |
| `ai-tutor.service.ts`    | Access check → limits → load context and last turns → build prompt → `LlmClient.chat` → `splitHintAnswer` → push both turns with `$push` → count usage. |
| `llm.client.ts`          | ~60 lines. Plain `fetch` to each endpoint in turn. Falls back on 402/429/5xx/timeout. No SDK dependency.                                                    |
| `ai-thread.schema.ts`    | `{ org, user, course, courseModule, kind, material?, selection?, turns[] }`, with the turns embedded. Indexes: `(org, user, courseModule, updatedAt)` for the learner and `(org, course, updatedAt)` for the teacher, derived per `index-with-mongodb`. |
| `ai-usage.schema.ts`     | `{ user, org, day: 'YYYY-MM-DD', count, tokens, lastAskedAt }`, unique on `(user, day)`, with a 60-day TTL like the log collections. Updated with an `$inc` upsert. The org monthly total is summed from this collection. |

Secrets (`apps/server/src/secrets/`, the `SENDGRID_API_KEY` pattern), documented in `.env.example`:

```
AI_TUTOR_ENABLED=true
# dev: HF router. prod: self-hosted only (see §1), e.g. an HF Inference Endpoint URL.
AI_TUTOR_ENDPOINTS=[{"url":"https://router.huggingface.co/v1","model":"Qwen/Qwen2.5-7B-Instruct","keyEnv":"HF_TOKEN"},
                    {"url":"https://router.huggingface.co/v1","model":"Qwen/Qwen2.5-3B-Instruct","keyEnv":"HF_TOKEN"}]
HF_TOKEN=hf_…                     # fine-grained token: Inference Providers / Endpoints only
AI_TUTOR_DAILY_LIMIT=15
AI_TUTOR_ORG_MONTHLY_LIMIT=2000
```

- **Learner access:** the learner must be able to read the course. Reuse the check the learning
  course routes already apply, and verify which one it is at build time. A learner only ever
  reads their own threads.
- **Teacher access:** the course must belong to the teacher's org, which is the same rule the
  course-comment inbox uses.
- **Deleting:** a learner's remove is a soft delete, and the thread then disappears for the
  teacher as well.
- **Kill switch:** `AI_TUTOR_ENABLED=false` makes the routes return 503, and `GET usage`
  reports `enabled: false`, so the UI hides the button and the tab.
- **Logging:** log model, latency, token counts and fallbacks, never the question text.

Answers are not streamed in phase 1, because they are short and a spinner is enough. Streaming is
phase 2.

---

## 7. Apps

Follow `use-ui-component` and `add-app-screen`.

### Learning

**Store** — `src/stores/ai-tutor.store.ts`: threads keyed by id, a lookup by module, `usage`,
and actions `startSelection`, `startModule`, `ask`, `fetchModuleThreads` and `remove`, each wrapped in
`run(key, …)`. **Service** — `src/services/ai-tutor.service.ts`, using the auth caller.

**Selection → Ask AI**

- A new `packages/ui/src/content/useTextSelection.ts` hook. It listens to `selectionchange` inside
  a container ref and returns `{ text, rect } | null`. It ignores selections shorter than ~3 words
  or outside the container.
- A `SelectionAskButton`: a core `Popover` anchored to the selection rect. If the core Popover
  can't take a virtual anchor, add that to the wrapper first via `create-core-component`.
- Wire it in `components/tools/ViewTextContent.tsx`, **both** in the inline view and inside its
  `FullScreenModal`.
- Clicking it opens the core `Modal`, which is already a side sheet. The sheet shows the quoted
  passage, a question box with chips ("Explain simply", "Give an example", "Why is this true?")
  and the thread.

**Module → Ask AI tab**

- A new tab in `CourseOutline.tsx` next to Discussion. It lists this module's threads, both
  selection and module ones, newest first. Opening one shows the conversation, with a composer
  (`CommentComposer` from `@repo/ui/app/discussion`) and starters ("Summarise this module",
  "Quiz me on this").

**A tutor turn** renders the hint as a highlighted callout. Below it is **"Show full answer"**,
which reveals the answer. Both are rendered with `richTextFromMarkdown` → `RichTextView`, so
equations look the same as in the lesson. Under every turn: "AI can be wrong — check with your
teacher" and **"Post to discussion"**, which turns a doubt into a course comment.

Above the composer: "Your teacher can see these questions · 12 left today".

### Teaching

- A **"Student questions"** section on the course page, beside the discussion section. It lists
  threads by module and learner, paged, read-only, and is built from the course-comment inbox
  pieces.
- Phase 2 adds a per-module count of questions. Modules with many questions are the ones whose
  material needs work.

---

## 8. Phases

| Phase | Scope                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | Shared contracts + prompt builders, `ai-tutor` module (fallback list, limits, stored threads), learner selection sheet + module tab with hint/answer, teacher read-only list. HF token in dev. |
| **2** | Streaming answers. Per-module question counts for teachers. A teacher can reply inside a thread.                                                       |
| **3** | Per-org on/off and limits set from the teaching app. A self-hosted endpoint as primary once usage outgrows credits. Answers in the course's language for language courses. |

## 9. Verification

- `pnpm build:shared`, then typecheck + lint learning, teaching, ui and server (`verify-changes`).
- Server, on dev with a real HF token:
  - Start both kinds of thread and ask a follow-up.
  - Force the first endpoint to fail (a bad model id) and confirm the fallback answers.
  - Hit the cooldown and the daily limit, and confirm both 429s.
  - Ask an off-topic question and confirm the refusal.
  - Check that a reply with the markers missing still splits into a hint and an answer.
  - Confirm a learner cannot read another learner's thread, and a teacher from another org cannot read the course's threads.
- Browser (Playwright):
  - As the learner test account: select a paragraph, ask, open the full answer, and see an equation render. Repeat in full screen. Reload and see the thread still there.
  - As the teacher: see the thread in "Student questions".

## 10. Before building

1. Create a fine-grained HF token and put it in `apps/server/.env.development` as `HF_TOKEN`.
2. Confirm both suggested models show a live provider on their HF pages that day. If not, pick
   the nearest instruct model that does, and record it in `AI_TUTOR_ENDPOINTS`.
3. Before production: choose the self-hosting option (§1: Inference Endpoint, GPU VM or CPU), and
   load-test it with the expected number of concurrent learners.
