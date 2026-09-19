# Generating a test paper with an external model

The teaching app writes a prompt, the teacher pastes it into any model, and pastes the model's
JSON reply back. Nothing in the app calls a model, so any provider works, and nothing is saved
until the import step has checked the reply.

Entry points: **Generate with AI** in a test paper's header, **Generate questions** in a section's
split button, and the "No sections yet" state.

## The three steps

1. **Blueprint** — tick the sections to fill (or add a section for the import to create), the
   number of questions of each type, chapters to cover, the difficulty split, exam style,
   language, and free-text instructions.
2. **Prompt** — the drawer writes the prompt from the blueprint and the workspace's ids. Copy it or
   download it as Markdown. The builder lives in `test-paper-generator.ts` (`buildTestPaperPrompt`).
3. **Import** — paste or upload the reply. It is parsed, checked against this paper (ids, counts,
   answer keys, per-type rules, duplicates), previewed as it will appear, then written through
   `POST question/bulk-upsert`. New sections named in the file are created first.

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
          "options": [{ "body": "…", "isCorrect": true }, { "body": "…", "isCorrect": false }],
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

## Why Markdown and not the editor's JSON

Models write Markdown and LaTeX reliably; they do not write ProseMirror documents reliably. The
importer already converts Markdown (`richTextFromMarkdown` in `packages/shared`), so the file
stays readable to a person and the conversion stays in one place.
