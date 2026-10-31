# Python for Beginners — course plan

Status: **draft for Manish's review** (2026-10-31). Nothing is written or imported yet.

The pilot coding course. It reuses the aptitude pipeline (catalogue → day files → build checks →
import to dev → review → prod) and the lesson design in
`apps/teaching/src/utils/ai/LESSON_DESIGN.md`. Code shows through the new code block (language
label, colours, copy button; commits `0b9051d`, `74238b9`).

## 1. Who and what

- **Learners:** complete beginners, about 14–20: school students (it covers the Python part of
  CBSE Computer Science, Class 11) and first-year college students. No prior coding.
- **Outcome:** read and write short Python programs with variables, strings, decisions, loops,
  lists, dictionaries, functions, files and error handling; trace what a program prints; find and
  fix common bugs.
- **Standard followed:** Python 3.12, PEP 8 style (4-space indents, `snake_case`), f-strings for
  formatting. Nothing from Python 2. Where an older textbook form differs (`%` formatting), one line
  says so.
- **Where learners run code:** the course does not need a computer for every lesson (phones are
  the main device), but each week ends with a "Try it" box naming what to type in IDLE or any free
  online interpreter. Running code inside the app is phase 2 (§7).

## 2. Shape

One course, **6 weeks × 5 days = 30 days**: 27 topic days and 3 revision days, like the aptitude
series.

- **Topic day:** one lesson (learn, then play) + three papers, **Easy / Medium / Hard**, 10
  questions each.
- **Revision day:** a recap lesson (one table per topic) + two **Mixed Tests** of 15.
- Lesson names: `<Topic>: ideas and practice`; papers `<Topic> · Easy` etc.
- Key points use the phone tables with **K-numbers** (`K1`, `K2` …): one per idea, cited by the
  papers as the aptitude papers cite F-numbers.

## 3. Weeks and days

| Week | Days |
| --- | --- |
| 1 · First programs | What a program is and how Python runs it · `print()` and comments · Variables and assignment · Numbers and arithmetic (`//`, `%`, `**`, precedence) · `input()` and type conversion |
| 2 · Strings and decisions | Strings: indexing and slicing · String methods and f-strings · Booleans, comparisons and logical operators · `if`, `elif`, `else` · **Revision 1** (weeks 1–2) |
| 3 · Loops | `while` loops · `for` and `range()` · Loop patterns: count, sum, maximum, search · `break`, `continue` and nested loops · Tracing code and reading errors |
| 4 · Collections | Lists · List methods, slicing and copying · Tuples · Dictionaries · **Revision 2** (weeks 3–4) |
| 5 · Functions | Defining and calling functions · Parameters and `return` · Default and keyword arguments · Modules: `math` and `random` · Scope: local and global |
| 6 · Programs that hold up | Sets and choosing a collection · Errors and `try` / `except` · Reading and writing files · A small project: marks report · **Revision 3 and course test** (weeks 5–6, then the whole course) |

(30 days: 27 topics + 3 revision days, the last also holding the course test. A day can move
between weeks once the topic list is agreed.)

## 4. A lesson for code

Same learn-then-play shape, with blocks chosen for code:

- **Concept** (80–150 words): the idea, one short `python` block, its output in a `text` block, and
  one "Watch out" mistake (`=` vs `==`, off-by-one in `range`, changing a list while looping).
- **Predict the output** — a `check`: code, then the four outputs a beginner might expect; the
  distractors are the real mistakes.
- **Trace it** — a `steps` block walking the code line by line, the changing variable in bold,
  like a trace table.
- **Find the bug** — a `check` with a broken program and the line to change.
- **Fill the gap** — a `reveal` with the missing line behind a tap.
- **Python shell** — `python-repl` blocks (`>>>`) for quick one-liners.
- Figures where they teach: variables as labels on values, list indexes (including negative), a
  flowchart for `if`/`while`. Drawn as SVG with the existing helpers; no 3D in this course.
- Key points table + cards (terms such as *variable*, *iteration*, *argument*, *exception*).

## 5. Tests

- Every code question shows its code in a `python` block inside the question.
- Types: single choice (what prints, which error, which fix), multiple choice (which names are
  valid), integer (the number printed), fill in the blank (the missing keyword or value),
  true/false sparingly.
- Every solution says why, names the K-number, and ends `Review: <lesson name>`.
- No question repeats a lesson example (the overlap check from the aptitude work runs on every
  day).
- Correct options spread across A–D; no valid alternative marked wrong (two programs printing the
  same thing are both right).

## 6. Accuracy: the build runs the code

The biggest risk in a coding course is a wrong output. The workspace build will:

1. Run every `python` block of every lesson and question with Python 3.12 in a subprocess (time
   limit, no network, no file writes outside a temp folder; `input()` fed from a declared stdin).
2. Compare what it printed with the `text` block that follows it; a mismatch fails the build.
3. For "what prints" questions, compute the correct option by running the code, and fail if the
   key disagrees or a distractor equals the real output.
4. Check every snippet against PEP 8 basics (indent of 4, no tabs) and that a "find the bug" program
   really fails before the fix and passes after.

## 7. Phase 2 (after the pilot): run code in the app

A "Run" button on `python` blocks using Pyodide (Python compiled for the browser): free, no server,
works offline once loaded (~10 MB the first time). Only after the course proves the format and
Manish agrees.

## 8. Workflow

Workspace `.course-agent/work/python/` mirroring aptitude: `catalog.mjs` (the 30 days), one day
file per day, `build.mjs` (shape + code-running checks), `import.mjs` / `update.mjs`. Writers draft
a week at a time offline; the main session audits and imports to **dev**; Manish reviews on a
phone; production only on his yes.

## 9. Decisions needed

1. **Catalogue:** a new standard and subject, e.g. standard *Programming*, subject *Python*?
   (Created in the support app.)
2. **Length:** 6 weeks / 30 days as above, or shorter (4 weeks) or longer (8 weeks)?
3. **Plan:** free like the aptitude courses, or paid?
4. **Series:** stop at Beginners, or plan *Python Intermediate* (OOP, modules, data) after it?
