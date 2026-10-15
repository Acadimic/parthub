# Compact, interactive lessons

Plan, 2026-10-16, after customer feedback on the new Sanskrit Beginner course. **Features first,
content after**: we decide and build the interactive features, then rewrite lessons to use them.

**Status 2026-10-16: the first set is built (uncommitted) and shown in a demo course.** A1 Show
answer, A2 Quick check, B1 Sound board, C3 Flashcards, C4 Say it, D1 centred short topics, D2 figure
height cap — reader, editor, Markdown both ways, import check, print. Demo course "Sanskrit Beginner:
Interactive Demo" (`6ad1315fbe930b6d8e3e58ac`, dev, published): two compact lessons (485 and 463
words, 8 topics each). Checked: typecheck and lint of the touched workspaces, a Markdown round trip,
both stored lessons valid against the editor schema, and a browser walk-through at laptop and phone
size. Visual set added the same day, after Manish asked for more visual concepts (§3b below): gender
colour, dialogue as a comic, Build it step by step (B3), Picture with labels (B2, with find mode),
and a third demo lesson using them (`This is a boy, this is a girl, this is a book`, 525 words).
Not yet: the shared lesson prompt and writer brief on the compact rules, and the Beginner rewrite.

### 3b. Visual concepts (Manish, 2026-10-16)

Built: **gender colour everywhere**, **dialogue as a comic**, **step by step**, **picture with
labels**, **where the sound is made** (`soundmap`) and **sentence picture** (`sentence`), each in
the demo course (days 3–5). Later: **sound you can see** (syllables light up with the audio; needs per-syllable
timing). Richer art: an openly licensed illustration set (OpenMoji, CC BY-SA 4.0; Twemoji
graphics, CC BY 4.0) checked for licence terms before use. Applies to every course the agent writes; the Sanskrit Beginner course is the
first one rebuilt.

## Decisions (Manish, 2026-10-16)

1. **No fixed card count.** A lesson is as long as its concept needs and no longer: compact, and
   everything on it about the concept (§2).
2. **Features first**: agree the interactive features (§3), build them, then write content with them.
3. **No game layer for now**: no points, stars, streaks or finish screen. (Kept in §6 as a later idea.)
4. **No gate**: a learner can always move on, answered or not.
5. **Letter audio**: a teacher records the letter and syllable clips (§5).
6. **Beginner is rebuilt in place**: same course, same lessons, rewritten content, so learners who
   started keep their progress. (No new course.)

## 1. The feedback, and its cause

| Feedback | Cause, measured on the Beginner course |
| --- | --- |
| Too long, too much reading | A day averages **~1,700 words on ~15 reader pages**. Eleven fixed sections; Key terms, Summary and Review later repeat the same items three times. |
| Questions in the text, answers elsewhere | **~7 questions per lesson**, all answers in one block at the end of Practice. The document format has no block that can show or check an answer. |
| White space in the topic reader | Each reader page fills the screen height with its content at the top (`TopicReader`), and topic length is whatever the writer wrote: a short topic leaves the screen blank, a long one scrolls. |
| Some sounds are incorrect | The speech model garbles bare letters and ignores vowel length (§5). |

## 2. A compact lesson (rules, not a template)

- **One concept per lesson day where possible**, two at most. Everything on the page serves it.
- **Show, then act.** The concept is shown (picture, sound, a three-row table, an example) and
  the learner does something with it straight away (§3). Explanation is at most a few lines.
- **One screen per topic**: each `##`/`###` topic is 30–130 words, or one figure with up to 50
  words. Longer means split; shorter means merge.
- **Every question carries its answer** in an interactive block. No Answers section.
- **No repeats**: the separate Key terms, Summary, Review later and Important notes sections go.
  New words live once, as a flashcard set or a tap-to-hear grid; earlier days come back as a few
  practice items, not a list.
- **Plain sections kept where they earn their place**: a short dialogue, a "say it" practice, a
  "watch out" item for a common mistake (as a check, not a paragraph).
- Measured target for the Sanskrit Beginner: roughly **400–800 words**, 5–10 topics, and an
  interaction on most topics. The checker reports these as guidance, not hard limits.

## 3. Feature catalogue — what we could build

Each feature is a new block in our content format, built the way the 3D scene is: one node holding a
small JSON description, with a renderer in the reading view, a form in the editor, a Markdown form so
the course agent can write it, a check on import, and a printed version. Sanskrit audio inside any
block plays through the existing pronunciation marks, so no new audio path is needed. Answers live
on the learner's device only; nothing is scored or stored.

Grouped by what it solves. Effort is for one developer, end to end (reader, editor form, Markdown,
validation, print).

### A. Answers next to questions

| # | Feature | Learner sees | Use in Sanskrit | Effort |
| --- | --- | --- | --- | --- |
| A1 | **Show answer** | A question; a button reveals the answer and a one-line why, in place | Any open question: "what does this mean?", "why कुशलिनी?" | 1 day |
| A2 | **Quick check** | A question with 2–4 options (text, Sanskrit, picture or sound); a tap turns it green or red at once, shows why, and lets them try again | Meanings, which form fits, which sound you heard | 2 days |
| A3 | **Fill the gap** | A sentence with a gap and 3–4 word chips (or a short typed answer); checked at once | Endings: बालक__ (ः / म् / े) | 1–2 days |

### B. See and hear (visual understanding)

| # | Feature | Learner sees | Use in Sanskrit | Effort |
| --- | --- | --- | --- | --- |
| B1 | **Sound board** | A grid of tiles (letters, syllables, words); tap a tile to hear it; optional row and column labels | The varṇamālā as a playable chart; क with every vowel sign; a paradigm table where each cell speaks | 1–2 days |
| B2 | **Picture with labels** | A picture with numbered points; tap a point to see the word and hear it; "find the …" mode asks them to tap the right point | Classroom, house, family tree, a body with नेत्रे / हस्तौ | 2–3 days |
| B3 | **Step by step** | A diagram or table that builds up one step at a time with Next / Back (each step a line of text and a highlight) | How a word takes its ending; the mouth from throat to lips; a sentence built word by word | 2 days |
| B4 | **Compare** | Two or three items side by side, each playable, with what differs highlighted | इ / ई, त / ट, श / ष / स; एषः / सः | 1 day |

### C. Practise by doing

| # | Feature | Learner sees | Use in Sanskrit | Effort |
| --- | --- | --- | --- | --- |
| C1 | **Match pairs** | Two columns of tiles; tap one on each side to pair them; right pairs lock | Letter ↔ sound, word ↔ picture, singular ↔ plural | 2 days |
| C2 | **Put in order** | Word or letter tiles to tap into order; several right orders allowed | Build a sentence; spell a word from letters | 2 days |
| C3 | **Flashcards** | A small deck: front (Devanagari, with sound), back (meaning, IAST, gender); flip, Next | The day's new words, instead of Key terms | 1–2 days |
| C4 | **Say it** | A line to say; Listen, Record, then play both one after the other. No score. | Every "Speak" item | 1–2 days |
| C5 | **Listen and choose** | Audio only (text hidden), then a quick check | Minimal pairs, dictation of a word | — (A2 with an audio prompt) |

### D. Reader layout (no new block)

| # | Change | Effort |
| --- | --- | --- |
| D1 | A short topic is centred vertically instead of sitting at the top | ½ day |
| D2 | Figures default to medium width with a height cap; a picture and its two lines sit side by side on a wide screen | 1 day |
| D3 | A screenshot pass (Playwright, phone and laptop) over every topic of a lesson, flagging a topic that fills under 35 % or over 100 % of the screen | 1 day |

### Suggested first set

**A1, A2, B1, C3, C4 and D1–D2** — about 8–10 days. They answer all four complaints: answers sit next
to questions (A1, A2), letters and words become something to tap and hear rather than read (B1),
the repeated word lists become one flashcard set (C3), speaking becomes an action (C4), and the white
space goes (D1, D2). Next: B2 and C1 (the most "playable"), then A3, B3, B4, C2.

## 4. Building and writing

- Each block: schema node + reader renderer (`@repo/ui/content`) + editor form (the `SceneDialog`
  pattern) + Markdown in/out (fenced `::: name` blocks like `listening`) + import check
  (`validateAiMaterials`) + print form (`@repo/ui/print`, answers listed at the end).
  Documented in `packages/ui/src/editor/README.md`.
- The shared lesson prompt (`packages/shared/src/ai/study-material-prompt.ts`), the Sanskrit
  `WRITER_BRIEF.md` and `check.mjs` learn the compact rules of §2 and the new blocks.
- Then the Sanskrit Beginner is rewritten **in place** (same lesson and test ids; `update.mjs`
  rewrites by id): week 1 first for review, then weeks 2–6, then a re-transfer to production.

## 4b. Coverage (Manish, 2026-10-16)

Coverage of the course's concepts comes before length: a day may run longer (Beginner up to about
1,100 counted words) when its concepts need it. `coverage.mjs <level> <days> [--strict]` reads each
day's planned forms from `weeks.mjs` and reports, per form, whether it is in the lesson, practised in
an interactive block, and in the day's test; `--strict` fails a form that is neither practised nor
tested. Baseline, the long week 1: 101/101 forms present, 72 practised, 92 tested, 5 never practised
or tested. Week 1 is rewritten in place against `--strict` (brief: `COMPACT_BRIEF.md` in the Sanskrit
workspace; old lessons kept in `beginner/content-v1/`).

## 5. Sounds

Done 2026-10-15/16: every one- and two-letter clip in all 30 days checked with a phoneme recogniser
and regenerated until heard right; long/short vowel pairs regenerated to a measured 2 : 1 length;
ॠ built from the checked ऋ take. Fixes are pushed to production at the same addresses.

Next, agreed:

1. **Teacher-recorded letter set** (~110 clips: 48 letters and marks, the 12 vowel signs on क,
   common joined letters, numbers 1–10). A script cuts one long recording into named clips, and every
   single letter or syllable in every course plays the human take. Generated audio stays for words
   and sentences.
2. Proposed: **Report this sound** on the pronunciation card (the report-an-issue feature exists),
   and a **teacher audio review page** (every short clip of a course with Play / Approve / Regenerate).

## 6. Later (not now)

Points, stars, streaks, a finish screen, "practise my mistakes", spaced review across days, and
saving practice results on the server. All sit on top of §3 without changing it.

## 7. Open questions

1. Which features to build first: the suggested set in §3, or a different pick?
2. Report this sound and the teacher audio review page: build them with the first set, or later?
3. Who records the letter set, and when? (A quiet room and a phone are enough; a script does the rest.)
