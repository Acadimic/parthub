# Quiz option order: the correct answer is always A

## What was found (2026-10-04)

Tally of where the correct option sits, every course in dev:

| Course | Single choice: correct at A | Multiple choice: A among correct |
| --- | --- | --- |
| Spanish A1–A2 | **134 / 144 (93 %)** | 48 / 48 |
| Spanish B1–B2 | **144 / 144 (100 %)** | 48 / 48 |
| Astrophysics Foundations | 9 % (fine) | 43 / 48 (high; ~30 expected) |
| 14 aptitude / reasoning courses, Physics Foundation | 21–31 % (fine) | — |

Production holds the same two Spanish courses (copied from dev), so it has the same skew.

## Why

- Nothing in the pipeline orders options. `toQuestionRows` in
  `packages/shared/src/ai/test-paper-generator.ts` keeps the reply's order, and neither app shuffles
  at display. The learner sees the order the writer typed.
- A model writes the right answer first unless something stops it. The prompt asks for "not
  systematically in the same position", but nothing checks it, and the prompt's own example puts the
  correct option first.
- The aptitude courses are fine only because their build placed the answer itself
  (`.course-agent/work/aptitude/lib.mjs` `toOptions`: position = hash of the body mod 4) and banned
  letter references in solutions.

## Safe to reorder

- Learner answers are stored as option ids (`test-paper-result.schema.ts` `answerMaps`), and
  marking reads `isCorrect` by id. Reordering an options array, keeping every `_id`, leaves past
  results and scores correct.
- No Spanish solution names an option by letter or position, and no option text depends on its
  position (two say "both", about their own content). Checked by script over all 384 choice
  questions.

## Part 1: fix the existing data

A script, `.course-agent/work/rebalance-options.mjs --target dev|prod --course <id> [--apply]`:

1. Back up every paper's questions to `.course-agent/work/backup-options-<course>-<date>.json`.
2. For each singleChoice and multipleChoice question, reorder `options` and keep every `_id`, body
   and `isCorrect`. Single choice: within a paper, deal the correct positions from a shuffled
   A/B/C/D cycle, seeded by the paper id, so each paper is balanced and a rerun is a no-op.
   Multiple choice: a permutation seeded by the question id. Boolean and integer are untouched.
3. Write through `question/bulk-upsert`; dry run prints the before/after tally per paper.
4. Run on A1–A2 and B1–B2 in dev, re-tally, then production after a yes. Optionally the
   Astrophysics multiple-choice questions.
5. Reorder the A1–A2 source files too (`a1a2/quizzes/revised/*.json`), or `update-quizzes.mjs`
   would write the old order back on its next run. B1–B2 sources are import-once (`import.mjs`
   refuses a re-import), so they need no change.

## Part 2: stop it recurring (shared generator)

All in `packages/shared/src/ai/`, so the teaching app's paste flow and the course agent CLI both
get it:

1. **Place options on import.** In `toQuestionRows`, order the options of singleChoice and
   multipleChoice with a deterministic shuffle seeded by the question body (one small
   `arrangeOptions` helper in `utils`), so re-importing the same reply gives the same order. Boolean
   ("True", "False") and typed answers keep their order.
2. **Prompt.** Move the example's correct option off A, and state: "Options are shuffled on
   import; never refer to an option by letter or position in the body or solution."
3. **Validator.** In `checkQuestion`, a warning when a body or solution refers to an option by
   letter or position (the aptitude `LETTER_RE`), because a shuffle would make it wrong.
4. **Course review.** In `course-review.ts`, a warning per paper when more than half of its
   choice questions have the correct option in one position, so an import that bypasses the
   shuffle is still caught on the dashboard.
5. Writer briefs (`spanish/*/WRITER_BRIEF.md`, `QUIZ_BRIEF.md`): "options are shuffled; put the
   correct one anywhere; never cite letters". C1–C2 starts with this in place.

Not chosen: shuffling at display, per learner, in the learning app. It changes the letter a learner
sees between attempts and in review screens, touches the exam UI and results, and is not needed
once the stored order is random. It can be added later on top of this.

## Verify

`pnpm build:shared`, typecheck all six workspaces, `pnpm lint`; import a sample reply in the
course agent dry run and confirm the spread; re-run the tally (dev, then prod) and
`course:review` on both Spanish courses (no new warnings).
