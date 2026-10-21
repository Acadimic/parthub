# How a lesson is built

The rules every generated lesson follows, whoever writes it: the teaching app's prompts
(`packages/shared/src/ai/study-material-prompt.ts`, `course-generator.ts`, which follow this guide
since 2026-10-18), the `course-builder` agent, or a course workspace's writer brief. They come from rebuilding the Spanish
(A1–C2) and Sanskrit courses in October 2026 and from what learners and Manish said about them. A
course brief adds only what is particular to its subject; it does not restate these.

The blocks themselves (syntax, what each renders as, how Markdown converts) are documented in
`packages/ui/src/editor/README.md` §3; the decisions behind them in
`.claude/plans/INTERACTIVE_LESSONS.md`.

## 1. The shape: learn, then play

Readers said the first compact lessons had good practice but nothing that taught the idea, and the
long lessons before them were too much reading with the answers far from the questions. A lesson
now alternates **a few concepts, then playable items**, again and again, until every concept of the
day is covered, and ends with the key items of all of them.

```
# Title                  one or two lines: what you will be able to do
## Topic                 ::: concept (the idea)  →  practice that uses exactly that idea
## Topic                 ::: concept  →  ::: concept (at most two in a row)  →  practice
…
## Listen / Say it       a hidden listening with its check; a ::: say block
## Key points            ::: concept title="Key points": one line per concept + one example
## Remember              ::: cards: every new word or term, once
```

- **One concept per lesson where possible**, two at most. Everything on the page serves it.
- **Show, then act.** An example or a picture → what to notice → the rule in a line or two → the
  learner does something with it at once.
- **One screen per topic** (`##`): about 30–130 words, or one block or picture with a few lines.
  Longer means split; shorter means merge.
- **No repeats.** No separate Summary, Review later, Important notes or Answers sections: the Key
  points box is the summary, the cards are the word list, and every answer sits inside its block.
- **Length follows coverage.** A lesson is as long as its concepts need. Concepts add about 300–500
  words; the Spanish and Sanskrit lessons run 1,500–2,500 counted words. Coverage beats brevity, but
  tighten prose that does not teach.

## 2. Concepts (the explanation)

A `::: concept` block is a reading screen that teaches one idea **before** it is practised.

- **80–150 words**, plain English: what it is, when to use it, how it is formed (a small pipe table
  where it helps), 2–4 examples, and **one common mistake** ("Watch out: …").
- **Title only when the heading above does not already name the idea**; never repeat it.
- **No questions inside**, and no other `:::` block inside it.
- **Accurate first.** Say "usually" and give the counter-example instead of a false "always" or
  "never"; teach a form by the rule that really governs it; check a claim against a reliable source
  rather than memory. An audit of the old Sanskrit series found 50 errors, most of them confident
  "always" rules and explanations that contradicted the course's own examples.
- **Reuse before writing**: when an older long-form lesson already explains the idea well, tighten
  its text into the concept rather than inventing new prose.

## 3. Play (practice)

Each concept is followed by one or more blocks that practise **exactly** that concept.

| Block | Use it for |
| --- | --- |
| `::: check` | a question answered on the spot; any `[x]` counts; the "why" after `---` |
| `::: reveal` | an open question (translate, say it, explain) with its answer behind a tap |
| `::: steps` | a form built one change at a time (bold the part that changes) |
| `::: sentence` | a sentence as coloured tiles by role (doer, action, object, place, time…) |
| `::: soundboard` | a whole closed set to tap and hear (an alphabet, a paradigm, a word group) |
| `::: soundmap` | sounds arranged by where the mouth makes them |
| `::: picture` | labelled points on a figure; `mode=find` turns it into "tap the …" |
| `::: say` | lines the learner says aloud (every lesson has one in a language course) |
| `::: listening … transcript=hidden` | a dialogue or passage heard first, then a check about it |
| `::: cards` | the closing flashcards: every new word, once |

- **Every question carries its answer** in its block. Nothing is answered in a list at the end.
- **Teach a closed set whole**: show the whole alphabet, paradigm or number range in one board,
  then practise the tricky members. (Week 1 of Spanish once skipped *a, be, ce, de*; it was caught.)
- **Mediation where it fits**: "Your friend does not speak Spanish. What does this sign say?"
- **Build on what came before**: use earlier forms freely; a later form only as a labelled fixed
  phrase.

## 4. Visualisation

Use a picture wherever it is clearer than words, and make every picture carry the lesson.

- **Figures** (`![alt](figure:F1 "caption")` with an SVG in `figures`): charts, geometry, timelines,
  clocks, scenes, mouth diagrams. One `<svg>` with a `viewBox`, no script or external resource. Drawn
  figures invert in dark mode; photos do not.
- **Picture with labels** (`::: picture`): label a figure's parts; `mode=find` needs a figure with
  **no words on it**, or the answer is printed on the picture.
- **3D graphs** on an equation whose shape is the point, and **3D scenes** for solids, nets, dice,
  molecules and unit cells. The graph plots exactly the equation beside it; its sliders are
  quantities the lesson explains; its range shows the feature the text talks about.
- **Language courses**: a dialogue whose every line opens with `**Name:**` shows as a comic; nouns
  carry gender colour (`g=m|f|n`); the changing ending is bold; sentence tiles show who does what.
- **Media agree with the text and the question**: a listening text, a figure (drawing, alt and
  caption) and the question that uses them state the same counts, names, times and positions.
- **Maps** come from an authoritative boundary (for India, the official outline via the datameet
  data), never sketched freehand.
- **Look at every picture** before import (`render.mjs` in the Sanskrit workspace, a browser walk
  for the rest): a figure that reads wrong teaches wrong.

## 5. Closing every lesson

- **`## Key points`** holding `::: concept title="Key points"`: one bullet per concept of the lesson,
  the rule in a few words plus one example. Every concept appears there.
- **`::: cards`** after it: every new word, term or form, front = the item (marked, with gender),
  back = the meaning; `keyTerms` match the cards.

## 6. Coverage

Plan the forms first, then prove the lesson covers them. Each lesson's plan lists its `forms` (words,
paradigm members, phrases); every one must **appear and be practised in a block, or be tested** in
the week's test. `coverage.mjs <days> --strict` (Spanish and Sanskrit workspaces) fails a form that
is neither. Coverage is checked again after every rewrite.

## 7. Accuracy and standards

- **Never mark a valid answer wrong.** A single-choice item has exactly one correct option; a
  distractor that is also correct (another gender, an optional sandhi, a valid word order, a regional
  form) is a defect. Accept all valid forms, or set the context so one answer is uniquely right.
- **State the standard a course follows**, and note where another valid standard differs. Sanskrit
  follows spoken (Samskrita Bharati) usage with a one-line note where classical usage differs; Spanish
  labels Spain and Latin American forms rather than hiding either.
- **Real texts**: a verse or passage is quoted only after it is found in a named source and cited
  (text, chapter.verse, and the edition where numbering or readings differ); a metre is scanned
  syllable by syllable against its pattern, with any licence named. If a line cannot be confirmed, use
  another or label it "teacher-created".
- **Check facts, quotations and verses against a source** (DLE/RAE, Wiktionary, Monier-Williams/Apte
  via the Cologne dictionaries, GRETIL), and say "from memory, unchecked" when one cannot be found.
- **Label modern words** ("(spoken Sanskrit)", "(modern usage)") and regional ones ("Spain", "Mexico").
- An auditor's "debatable but consistent with the course" is a defect to fix, not a pass.

## 8. Tests

- Test what was taught, after it was taught; distractors are real misconceptions.
- Every solution says why, and ends `Review: <exact lesson name>`.
- **Options written inline** (`{ body, isCorrect }`); positional helpers once put 67 wrong keys live.
- Spread the correct option across A–D (`rebalance-options.mjs`), then run the key check
  (`keycheck.mjs` / `keys.mjs`) and read every suspect: the check is a heuristic, a person decides.
- Language tests include listening, a picture question, a situation and a mediation item.
- When a rewrite keeps stored question ids, keep each question's position, type and option count.

## 9. Vocabulary by topic

A course may close with a **"Vocabulary by topic"** module (the last module, after the final week):
one lesson per topic in the topic groups of a learner's dictionary, 30–50 new words in 3–5 groups,
each group a concept → a soundboard of the whole group → practice; a say block, a hidden listening,
Key points and cards with every word. It **adds** words the lessons did not teach (a "You know
already" line at most), its examples use only grammar the course taught, and every word is checked
in a dictionary. Never copy a dictionary's wording: choose the words and write the examples.

- **Look every word up**, not from memory (for Sanskrit, Monier-Williams or Apte through the Cologne
  dictionaries; for Spanish, the DLE or Wiktionary), and label a modern coinage ("spoken Sanskrit") or a
  modern sense ("modern usage").
- **No word twice**: a word taught on one topic, at any level of the series, is not taught again on
  another; check every topic's `forms` before importing (writers in parallel cannot see each other).
- An independent dictionary check of the finished topics still finds errors (gender counts, a group
  rule with an exception, a modern sense unlabelled); run it before import.

## 10. The workflow that catches mistakes

1. **Plan** (blueprint: each lesson's name, can-do, teach, practice, `forms`), reviewed by Manish.
2. **Write**, one writer per week or day, against the course brief and an approved exemplar.
3. **Check**: the lesson validator (`check.mjs`), coverage `--strict`, the concept rhythm
   (`concept-rules.mjs`: at least two concepts, at most two in a row, a closing Key points).
4. **Audit**: an independent read-only reviewer per week for accuracy, keys and facts; a dictionary
   check for vocabulary. Fix every finding, then check again.
5. **Fold the writers' findings back into the plan**: writers find errors in the blueprint itself
   (a wrong form, a wrong source, a misattributed verse); the plan is corrected to match the lessons.
6. **Import to dev**, add audio (and regenerate it after an update that drops it), look at it in the
   learning app at phone width, then hand it over for review.
7. **Production** only after Manish's yes.

## 11. Naming modules (Manish, 2026-10-18)

Textbooks show the grammar plainly: a reference grammar names each unit by it (Murphy: "Present
continuous (I am doing)"); a coursebook titles the unit by its situation and lists the grammar beside
it (Aula Internacional's communicative / grammar / vocabulary resources, Headway's contents table). We
do both: a grammar-first title, the situation as a subtitle, and a contents row.

- **Title: the grammar first, with an example, then the situation** — `Grammar (example) · situation`:
  "Past tense (अपठम्) · yesterday", "Present -ar verbs (hablo) · what you do", "Object pronouns
  (lo, la) · the restaurant". The sidebar shows one line and cuts at about 40 characters, so the part
  a learner searches for comes first; keep the whole title **under about 45 characters**.
- Use the **ordinary grammar name** a textbook would ("past tense", "third case (instrumental)",
  "adjectives", "pronouns"), with the native term where learners will meet it (लङ्, तृतीया).
- A **review or lab day** names what it reviews: "Review: past and future · my weekend".
- A day **without new grammar** (sounds, script, vocabulary, a skill) names that: "Vowels (अ आ इ ई) ·
  one beat or two", "Vocabulary · words by topic".
- **Subtitle**: the module's `subtitle` names the situation or theme in words a learner relates to
  ("How Spanish sounds, and saying hello", "ह्यः अपठम्: what I did yesterday" — the names the
  modules carried before this rule). The course preview page shows it under the title in place of
  the progress count; the learning sidebar keeps the count ("2 of 2 items done").
- **Contents row**: the module's `description` holds exactly three lines joined by line breaks —
  `You'll be able to: …`, `Grammar: …`, `Words: …` — about 15 words each, plain text. The preview page
  shows it when a module is opened, and the printed course under each module (both keep the breaks).
- **Where they live**: `CourseModule.name`, `.subtitle` and `.description` (server schema
  `course-module.schema.ts`, `CourseModuleDto`, `ICourseModuleFields`). A course workspace keeps them
  in `<course>/module-names.json` (`[{ day, name, subtitle, description }]`) and applies them with
  `.course-agent/work/module-names.mjs <courseId> <file> [--apply]`; where an update script copies
  module names from a blueprint (the Spanish `blueprint-v*.mjs` `module:` field), the blueprint
  holds the new title too, or the next update renames it back.
- Lesson titles keep their form: the example in the language, then the point in plain English
  ("Hablo, hablas, habla: -ar verbs").

## 12. Lessons learnt

- Concepts missing → readers could practise but not understand. Practice missing → they read and
  forgot. Both, alternating, is the shape.
- A concept title that repeats its heading shows twice; leave it out.
- Long rewrites drift: re-run coverage and the key check after every pass.
- Subagents treat the latest user message as their whole task; state the authorisation and the
  context in every writer prompt.
- Writers find errors in the plan itself (a wrong form in `weeks.mjs`): fix the plan, not just the
  lesson.
- Bulk updates write large change logs: check the dev database's size first (the free tier stops
  all writes at 512 MB).
