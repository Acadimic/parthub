# Spanish A1–A2, B1–B2 and C1–C2

Plan, 2026-10-03. Three Spanish courses on the CEFR scale, written with the pronunciation feature
(`.claude/plans/PRONUNCIATION.md`). Working files live in `.course-agent/work/spanish/`
(git-ignored); this file records the decisions and the task list.

## Decisions (Manish, 2026-10-03)

- **A1–A2 is the existing Beginner course, revised in place**: same course id
  (`6ab7e10f2663a77295f78b78`), same 60 days and 84 lesson ids, the Madrigal method kept as the
  backbone. Enrolled learners keep their place; production is updated by re-transfer after
  Manish's yes.
- **Standard level** means each day teaches a CEFR communicative function for its level (the
  Instituto Cervantes inventory, as catalogued on profedeele.es/funciones: greeting, giving and
  asking for information, describing, likes, narrating, advice, instructions, opinion…) with far
  more practice, in the style of the graded drills on aprenderespanol.org (estar, estar + gerund).
  Both are guides; the content is original.
- **Easy to understand**: short sentences in plain English, one idea at a time, tables, a short
  dialogue first, practice with answers.
- **References: at most two per lesson**, the existing 242 link attachments trimmed to match.
- **B1–B2 and C1–C2: 12 weeks × 5 days each**, same rhythm as A1–A2 (~84 lessons, 24 quizzes,
  one live session a week).
- **Names**: the subjects Beginner, Intermediate and Advanced are shared with English, Hindi,
  Sanskrit, French, German and Japanese, so they are not renamed; the CEFR level goes in each
  Spanish course's title ("Spanish A1–A2: …").
- The Spanish standard's `locale` is `es-ES` (set in dev 2026-10-03), so every Spanish prompt
  carries the pronunciation rules and the editor starts in Spanish.

## What changes in A1–A2

- Every lesson: a can-do line, a short listening dialogue, new words marked with IPA, a Practice
  section with answers, at most two references.
- `tú` from the first conversations (day 7), not only in week 12.
- More `estar`: conjugation, location and feelings, `estar` + gerund in affirmative, negative and
  question form, `ser` vs `estar` drills.
- Week 11 drops the subjunctive and the conditional (B1) for A2 functions: describing people and
  places, comparing, weather, health and advice, invitations. The two week-11 quizzes are
  rewritten to match. Polite `¿Me puede…?` / `Quería…` stay as fixed phrases.
- The day-by-day map is `.course-agent/work/spanish/a1a2/blueprint.mjs`.

## Tasks

1. **Setup** — Spanish `locale`; workspace, export of the current course, writer brief, check and
   update scripts. _Done 2026-10-03._
2. **A1–A2 blueprint** — 60 days mapped to function, grammar, vocabulary, pronunciation and
   practice. _Done 2026-10-03._
3. **A1–A2 week 1** as the exemplar; Manish reviewed it and asked for pronunciation marks in every
   section (Practice, Answers, Key terms, Summary…). _Done 2026-10-03._
4. **A1–A2 weeks 2–12**, one writer per week, each checked and updated in dev. _Done 2026-10-03:
   84/84 lessons revised in dev, 87 references (was 242), ~10,000 pronunciation marks._
5. **A1–A2 quizzes** — rewrite the two week-11 papers; check the other 22 against the revised days.
   Ids of questions and options are kept (`update-quizzes.mjs`), so earlier answers stay valid.
   _Done 2026-10-03._ Then, at Manish's request (2026-10-04), every paper was checked against the
   two resources (functions; estar drill styles) and given sound and pictures: 49 listening
   questions with the text hidden, 25 pictures, playable Spanish in questions and solutions
   (options only when all are correct Spanish). Every lesson got a "Listen and answer" exercise,
   and 42 lessons got pictures (44). Briefs: `QUIZ_BRIEF.md`, `MEDIA_BRIEF.md`.
6. **A1–A2 finish** — title "Spanish A1–A2: The Magic Key Method", description, outcomes, outline
   (one line per lesson); course review clean. _Done 2026-10-03 in dev._ Production re-transfer
   after Manish's yes.
7. **B1–B2** — blueprint (subjunctive, conditional, past contrasts, opinion and argument,
   hypotheses), course created with the course agent, 12 weeks of content and quizzes, sessions,
   review.
8. **C1–C2** — same, at C level (nuance, register, idiom, discourse markers, literature and press).
9. **Production** — transfer B1–B2 and C1–C2 after Manish's yes; publish when told.
