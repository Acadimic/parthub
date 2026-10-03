# Generating a test paper with an external model

The teaching app writes a prompt, the teacher pastes it into any model, and pastes the model's
JSON reply back. Nothing in the app calls a model, so any provider works, and nothing is saved
until the import step has checked the reply.

Entry points: **Generate with AI** in a test paper's header, **Generate questions** in a section's
split button, the "No sections yet" state, and **Generate with AI** on `/test-papers`, which makes
a whole paper from nothing but standards (see "A whole paper" below).

The step components the AI drawers share — `AiSteps`, `AiPromptStep`, `AiPromptPackStep`,
`AiIssueList`, `AiDrawerFooter` — live in `apps/teaching/src/components/app/ai/`. The parsing,
JSON repair and Markdown checks they all use are in `apps/teaching/src/utils/ai/common.ts`.

## The three steps

1. **Blueprint** — tick the sections to fill (or add a section for the import to create), the
   number of questions of each type, chapters to cover, the difficulty split, exam style,
   language, and free-text instructions.
2. **Prompt** — the drawer writes the prompt from the blueprint and the workspace's ids. Copy it or
   download it as Markdown. The builder lives in `test-paper-generator.ts` (`buildTestPaperPrompt`).
3. **Import** — paste or upload the reply. It is parsed, checked against this paper (ids, counts,
   answer keys, per-type rules, duplicates), previewed as it will appear, then written through
   `POST question/bulk-upsert`. New sections named in the file are created first.

## A whole paper

`AiWholePaperDrawer` takes standards and optional subjects and decides the rest: the name, quiz
type, thirty minutes, one section per subject (or one for the standard), a default type mix
(`test-paper-plan.ts`), solutions on. The prompt is the same builder; the import creates the paper
and its sections first, then the questions, and opens the paper.

## The JSON the model returns

Types live in `packages/shared/src/interfaces/ai-test-paper.interface.ts` (`IAiTestPaper`).

```json
{
  "format": "acadimic.test-paper/v1",
  "testPaperId": "<paper id from the prompt>",
  "title": "Kinematics unit test",
  "generatedBy": "model name",
  "sections": [
    {
      "ref": "S1",
      "sectionId": "<existing section id, or omit to create one>",
      "name": "Section A",
      "instructions": "Answer all questions.",
      "questions": [
        {
          "ref": "S1-Q1",
          "questionType": "singleChoice",
          "body": "Markdown with $LaTeX$ …",
          "options": [
            { "body": "…", "isCorrect": true },
            { "body": "…", "isCorrect": false }
          ],
          "solution": "Markdown …",
          "marks": { "correct": 4, "incorrect": -1, "unattempted": 0 },
          "level": "medium",
          "tag": "projectile_motion",
          "standard": "<standard id>",
          "subject": "<subject id>",
          "chapter": "<chapter id>",
          "estimatedMinutes": 2,
          "skills": ["kinematic_equations"]
        }
      ]
    }
  ]
}
```

- `questionType` is one of `singleChoice`, `multipleChoice`, `boolean`, `integer`, `fillInTheBlank`,
  `subjective`. Choice and boolean types carry `options`; the others carry `answer`.
- `marks` is optional; without it the section's default marks for that type apply.
- `level` is `easy`, `medium` or `hard`; `tag` is a short snake_case topic. Both are stored on the
  question for later analysis. `estimatedMinutes` and `skills` are shown in the preview only.
- Content is Markdown with LaTeX (`$…$`, `$$…$$`, `\ce{}` for chemistry). Inside JSON strings every
  backslash is doubled. The importer turns it into the editor's document format, so imported
  questions are editable like hand-written ones.

## Figures

A reply may draw pictures for its content: a `figures` list of `{ ref, alt, caption?, svg }`, each
placed in Markdown on its own line as `![alt](figure:<ref> "caption")`. The prompt's "Figures"
section (`FIGURE_RULES` in `packages/shared/src/ai/figures.ts`) asks for a picture wherever it is
clearer than words: charts, geometry, diagrams, clock faces, motion along a track, Venn diagrams.
Each SVG must be one `<svg>` with a `viewBox` on a white ground, with no script, event attribute,
foreign content, external link or resource, and at most 200 kB.

The validator (`checkFigures`) errors on a ref that is used but not defined and on an unsafe SVG,
and warns on an unplaced figure or one without alt text. Nothing is uploaded while a reply has
errors; at import each figure goes to the organization's `content/` folder (`uploadAiFigures`)
and the image nodes are pointed at it (`withFigureSources`). The editor and every reading view
then show it like an image a teacher uploaded; see `packages/ui/src/editor/README.md` §3a.

## Pronunciation

When the course's standard has a spoken language (`locale`, set on a language standard in the
support app), the prompt adds a "Pronunciation" section (`pronunciationRules` in
`packages/shared/src/ai/pronunciation.ts`): vocabulary, set phrases and example sentences come back
as `[Hola]{lang=es-ES ipa="ˈola"}` spans, dialogues and reading passages as `::: listening` blocks.
Any other course's prompt is unchanged. `checkPronunciation` warns on a span with no `lang`, an
unknown language code, and a listening block left open; the import keeps the text either way. See
`packages/ui/src/editor/README.md` §3b.

## Why Markdown and not the editor's JSON

Models write Markdown and LaTeX reliably; they do not write ProseMirror documents reliably. The
importer already converts Markdown (`richTextFromMarkdown` in `packages/shared`), so the file
stays readable to a person and the conversion stays in one place. The subset the editor stores,
and what the converter does with equations, is documented in `packages/ui/src/editor/README.md`.

## Equations in replies

A model that writes `\frac` with a single backslash inside JSON has written a form-feed escape,
and `\pi` is not a JSON escape at all. Before parsing, `repairJsonEscapes` doubles the backslashes
that cannot be JSON escapes and those that spell a LaTeX command; the count shows as a warning.
The validator (`checkMarkdownMath`) then warns per question about leftover control characters,
currency `$`, an odd number of `$`, and `\( \)` delimiters. The converter escapes a bare `%` or
`$` inside an equation and reads `$` in prose under Pandoc's rule, so a price is never an
equation. The shared prompt rules (`MARKDOWN_RULES`) tell the model all of this up front.
