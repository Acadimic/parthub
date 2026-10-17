# Spanish series: quality audit and the compact, interactive rewrite

Status: plan, 2026-10-16. Nothing built. The audit reports are in the git-ignored workspace,
`.course-agent/work/spanish/audit/` (`a1a2.md`, `b1b2.md`, `c1c2.md`, with sources and every finding).

The three Spanish courses (A1–A2, B1–B2, C1–C2; 60 days, 84 lessons and 24 tests each, live in
production) are to get the treatment the Sanskrit Beginner course got: compact, interactive lessons
with answers next to questions, checked against a coverage list, with stored audio for Sanskrit; Spanish keeps the device voice
(`INTERACTIVE_LESSONS.md`, `SANSKRIT_COURSE_DESIGN.md`). Before planning it, each course was audited
against the Instituto Cervantes *Plan curricular* (PCIC), the CEFR Companion Volume (2020), the DELE
exam tasks for its levels and two textbook syllabi per level (Aula Internacional, Nuevo Prisma,
Español en marcha, El Cronómetro), and every lesson and test was proofread.

## 1. What the audit found

|                                   | A1–A2                                   | B1–B2                                   | C1–C2                                         |
| --------------------------------- | --------------------------------------- | --------------------------------------- | --------------------------------------------- |
| Spanish of the lessons            | accurate, natural                       | very good                               | good, facts check out                         |
| Sure lesson errors                | 16 (mostly "always/every" rules)        | 23                                      | ~25, plus rules stricter than the RAE allows  |
| Test answer keys                  | 1 unscorable, 1 double answer, 1 false  | 0 wrong                                 | **67 of 144 single-choice keys wrong, live**  |
| Words per lesson (median)         | 1,358                                   | 2,035                                   | 2,033 (two-lesson days up to 4,600)           |
| Answers                           | one block at the end of each lesson     | one block, ~1,000 words after the first question | one block, ~1,400 words after             |
| Screen length                     | 9 fixed sections                        | 2 to 826 words per topic                | 65 to 739 words per topic                     |
| Stored audio                      | none (device voice)                     | none                                    | none                                          |
| Speaking / interaction / mediation | almost absent                          | ~6 speaking tasks in 82                 | no oral or cross-language mediation           |
| Tests                             | choose or count only                    | 1 reading item in 240                   | choose and number only; no production         |
| Level fit                         | preterite (day 4) before the present (day 22); some B1 items | strong; gaps listed below | really C1 with B2 review; almost no C2 |

**The three customer complaints about Sanskrit hold here too, more strongly:** the lessons are long
(1,400–2,000 words against Sanskrit's compact 1,000), every answer sits in an Answers block far below
its question, and topic lengths swing so much that some screens are near-empty and others scroll.
There is no stored audio at all: about 56,000 pronunciation marks and 700 listening blocks play
through the learner's device voice, one voice per dialogue, so an Argentine dialogue is read in
whatever voice the phone has.

**Coverage gaps against the PCIC** (full tables in the reports):

- **A1–A2:** demonstratives, the house and renting, *por/para* basics, *desde hace* / *hace* + time,
  *acabar de* and *soler*, congratulations and good wishes, classroom language, question intonation.
  *Gustar* comes late. The negative imperative (B1) is taught.
- **B1–B2:** future perfect and the conditional of probability, *cuyo*, verbs of change, the verb
  phrases (*dejar de, volver a, ponerse a, estar a punto de, llevar* + gerund), *ser/estar* with a
  change of meaning, turn-taking language, intonation, mediation. The perfect subjunctive arrives on
  day 37 although days 14–15 need it. Week 11's culture is invented (films, books, paintings).
- **C1–C2:** the values of *se*, prepositional regime and *por/para* nuance, mood alternations
  (*el hecho de que*, *que yo sepa*), regional phonetics (seseo, yeísmo, aspiration, *sheísmo*),
  Latin American literature, spoken and cross-language mediation, DELE C2 task types. Listening
  averages 40 seconds where DELE uses multi-minute lectures and debates.

## 2. Phase 0: fix what is wrong in production now (before any rewrite)

These are defects learners meet today. Each is a by-id edit in dev, then in production after a yes.

1. **C1–C2's 67 mis-keyed questions.** The quiz files' helper `opts(at, correct, ...wrong)` treats
   its second argument as the right option, while writers passed the options in display order with
   `at` as the right one's index, so the key lands on a wrong option (*Centrémosnos*, *mucho
   importante*, *Puede que lo supo*). Confirmed live in production on 2026-10-16. Fix: set
   `isCorrect` on the option each solution names (the list is in `audit/c1c2.md` §3a), keeping every
   question and option id, in dev and production; then fix the source files so a re-import cannot
   bring the bug back.
2. **A1–A2 test defects:** Week 10 Q9 has no correct option; Weeks 8–9 Q1 has two right answers;
   Weeks 1–4 Q7 keys a false rule as true; four solutions point at the wrong option by position;
   three solution texts are wrong or garbled (`audit/a1a2.md` §3).
3. **B1–B2:** Q15 Q4 uses *llegue* for a delivery that has happened.
4. **A check so it cannot recur:** every test checker gets a rule that the keyed option's text
   appears in its solution and no other option is presented there as correct, and solutions quote
   options instead of pointing at a position ("the second one").

## 3. Phase 1: tooling, before content

1. **Audio stays on the device voice** (Manish, 2026-10-16: no generated Spanish audio for now). Marks on
   lone letters, endings and punctuation are kept, as are the regional dialogues as written; audio for
   those is to be generated later, as a separate step.
2. **A Spanish coverage list per level**, built from the PCIC inventories (grammar, functions, notions,
   pronunciation) the way `coverage.mjs` reads Sanskrit's `weeks.mjs`: each form or function mapped to
   the day that teaches it; checked as present, practised in a block, tested; `--strict` in the
   writer's loop. The gaps in §1 become entries the rewrite must fill.
3. **The compact checker** (`compactIssues` in the Sanskrit `lib.mjs`) shared with the Spanish
   workspace: word ceiling, topic size, no Answers / Key terms / Summary / Important notes sections,
   every question in a block, lone-letter marks flagged.
4. **The answer-key rule** from Phase 0, in all three `check.mjs` files.

## 4. Phase 2 onwards: the rewrite

Same rules as the Sanskrit Beginner rewrite (`COMPACT_BRIEF.md` there), adapted:

- **Shape:** one concept per topic, 30–130 words per screen, show then act, every question an
  interactive block with its answer inside (`check`, `reveal`, `soundboard`, `cards`, `say`, `steps`,
  `picture`, `sentence`, `listening` with `transcript=hidden`). One flashcard set at the end replaces
  Key terms, Important notes and Summary.
- **Length:** A1–A2 about 500–900 words, B1–B2 and C1–C2 about 800–1,100; coverage beats brevity, as
  agreed for Sanskrit.
- **Tests:** ids kept where a question survives; fixed where wrong. New items move toward DELE task
  types: reading of notices and short texts, matching, gap fills, one short production task per week
  with a model answer to compare against.
- **Speaking:** a `say` block in every lesson; DELE-style oral tasks on review days (presentation,
  photo description, role-play with the learner's turns).
- **Mediation:** short "tell your friend in English what this sign says" tasks at A1–A2, relaying and
  summarising at B1–B2, multi-source and genre-change mediation at C1–C2.
- **Rules:** stated as "usually", with a counter-example, and checked against the RAE's *Nueva
  gramática* and *Diccionario panhispánico de dudas* where the lesson states a norm. Never mark a
  valid alternative wrong (the content-quality rules).
- **Culture:** real films, books, painters and music from Spain and Latin America.
- **Order of work:** A1–A2 first, one pilot week for review, then the rest; then B1–B2; then C1–C2.
  Each week: writers (five at most at once) → `check` + coverage `--strict` → update by id in dev →
  browser pass at laptop and phone width → review → production after a yes. Learner progress
  survives because ids are kept.

## 5. Decisions (Manish, 2026-10-16: "fix the wrong keys now, go with your recommendations")

1. **Phase 0: done 2026-10-16**, dev and production, every question and option id kept:
   - C1–C2: 67 keys moved (`fix-keys.mjs` with `audit/c1c2-fix.json`; 38 settled by the solution text,
     29 by reading). Source files now wrap those calls in `inOrder(helper)`, so the built key matches.
   - A1–A2: 18 questions patched (`a1a2/patch-tests.mjs`): the unscorable Week 10 Q9, the double answer,
     the false accent rule, position-citing solutions, over-strict rules marked wrong (*diez y seis*,
     *me encanta mucho*, *apetece*, *una* with illnesses), the café line.
   - B1–B2: Week 3 Q4 now uses *haya llegado* (`b1b2/patch-d15q4.mjs`).
   - `keycheck.mjs <level>` flags a keyed option its solution does not name; the remaining flags (5 in
     C1–C2, 3 in B1–B2) were read and are right. Backups: `spanish/backup-keys-*`, `a1a2/backup-patch-*`.
2. **A1–A2 sequence:** the present, *hay*, *gustar*, possessives and demonstratives move into weeks 1–3;
   the early preterite stays as fixed Magic Key phrases (*tomé, compré*) until the present is in place.
3. **C1–C2:** add real C2 content (DELE C2 tasks, C2 genres and lexis) in place of about five B2-review days.
4. **Audio:** no generated Spanish audio now; the device voice is the default (Manish, 2026-10-16).
   Lone-letter marks and regional dialogues stay as they are; their audio is generated later.
5. **Rewrite in place**, same course ids.

## 6. Course length (Manish, 2026-10-16)

- **A1–A2: 8 weeks / 40 days** (was 12 / 60): `a1a2/blueprint-v3.mjs`; dev cut by `restructure-40.mjs`
  (days 41–60 soft-deleted, their lesson records moved into days 16–40, ids kept). Production needs the
  same soft-deletes after review; the course-transfer import never deletes.
- **B1–B2 and C1–C2: shorter where the content allows**, the number of weeks chosen from the content when
  each course is redrawn (Manish: "reduce if possible or choose appropriate number of weeks based on
  contents"). Each redraw starts from that course's audit and must keep its coverage list complete.

## 7. Learn, then play (Manish, 2026-10-17)

Reader feedback: "the concepts to read are not available; the practice is good". Decisions: mix both;
concepts come gradually — a few concepts, then playable items, again and again until every concept is
covered; each lesson ends with the key items of all its concepts; B1–B2 waits for this before
production.

- New block `::: concept title="…"` (`CONCEPT_NODE` in `@repo/shared/utils`, reader `ConceptBlock`, editor
  node + Insert entry, Markdown both ways; editor README §3f). A tinted reading panel, 80–150 words:
  the idea, when to use it, a small table, examples, one common mistake.
- Lesson rule (`.course-agent/work/spanish/concept-rules.mjs`, wired into each level's checker for the
  days already revised): at least two concepts, never more than two in a row before playable items, and
  a closing `::: concept title="Key points"` listing every concept's key items, before the cards.
- Pilot: A1–A2 week 2, then all A1–A2, B1–B2, C1–C2 (the remaining C1–C2 weeks are written in this form).

## 8. Vocabulary by topic (Manish, 2026-10-17)

Manish asked for vocabulary from the Collins English–Spanish dictionary. Collins blocks automated
access (Cloudflare 403) and its entries are copyrighted. He chose:
- topic groups in the Collins Easy Learning style;
- our own word choice, checked against the DLE and Wiktionary, with Collins as his human spot-check;
- a separate module per course.

The module is **day 41, week 9, "Vocabulary by topic"**, with one lesson per topic (ten per level).
- Topics: `.course-agent/work/spanish/vocab/topics.mjs`
- Brief: `vocab/VOCAB_BRIEF.md`
- Check: `vocab/check.mjs <course> Txx`
- Import to dev: `vocab/import.mjs <course> Txx…` (ids are kept in `<course>/vocab/index.json`)

Each lesson has 35–50 words in 3–5 groups, each group a concept, then a soundboard, then practice.
It also has a say block, a hidden listening, mediation, Key points, and cards holding every word.
The A1–A2 pilot (T01 food, T02 town) is in dev for review.
