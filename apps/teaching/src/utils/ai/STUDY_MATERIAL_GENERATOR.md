# Generating study lessons with an external model

The teaching app writes a prompt, the teacher pastes it into any model that can search the web,
and pastes the model's JSON reply back. Nothing in the app calls a model, so any provider works,
and nothing is saved until the import step has checked the reply and looked up every address it
cites.

Entry points: **Generate with AI** in a subject's Contents header on
`/study-materials/<standard>/<subject>` (one subject, optionally narrowed to chapters), and
**Generate with AI** on `/study-materials` (a whole standard: every subject, or the chosen ones).

## The three steps

1. **Setup** — chapters to cover (empty means the whole subject), how many lessons, exam style,
   language, what to attach (videos, web references, PDF sources), whether to close with an
   exam-preparation sheet, and free-text instructions. The ladder of levels is decided from the
   count: about two-fifths easy, two-fifths medium, the rest hard.
2. **Prompt** — written from the setup and the workspace's ids by `buildStudyMaterialPrompt` in
   `study-material-generator.ts`. It asks the model to research first, then write each lesson in a
   fixed nine-section shape (goals, prerequisites, ideas, worked examples, applications, common
   mistakes, check yourself, key terms, summary), and to cite only addresses it has actually seen.
3. **Import** — paste or upload the reply. It is parsed, checked (ids, the ladder, per-lesson rules,
   resource shapes), then every resource address is verified through `POST common/verify-links`
   (YouTube via oEmbed, everything else by HEAD then GET). Unreachable references are shown struck
   through and left out. The lessons are previewed as they will look, then written through
   `POST material/bulk-upsert`.

## A whole standard

`AiWholeMaterialDrawer` takes standards and optional subjects and resolves them to
standard-and-subject pairs. Each pair gets its own prompt (`buildSubjectPromptPack`), because one
subject's lessons already fill a model's reply; the Prompts step lists them with copy and download.
The Import step accepts any number of replies — uploaded files or pasted text — reads each one's
`standard` and `subject`, refuses a reply for a pair the run did not ask for, and merges replies
by pair (`mergeAiMaterialFiles`). A model asked for many lessons may answer in parts carrying
`part: { index, total }`; the parts fold into one set, and a later part's lesson replaces an
earlier one with the same `ref`. The import writes one bulk request per subject, ordering the new
lessons after the subject's existing rows, and reloads the roll-up.

## What every lesson contains

The prompt fixes the shape so the set reads as one course: title and goals, prerequisites, the
ideas from intuition to formula, worked examples, applications, common mistakes, check-yourself
questions with answers, **Important notes** (must-remember facts and exam tips as a blockquote
list), **Key terms**, and a summary. The exam-preparation sheet gathers every key term A–Z, the
most-tested concepts, all important notes merged by topic, a formula table, question patterns,
traps and a last-day checklist. Research is ordered: the official syllabus first, then the
prescribed textbook and an open university text, then teaching sites and channels; the reply's
`outline` is the syllabus the model worked from, shown in the preview.

## The JSON the model returns

Types live in `packages/shared/src/interfaces/ai-study-material.interface.ts` (`IAiStudyMaterial`).

```json
{
  "format": "acadimic.study-material/v1",
  "standard": "<standard id>",
  "subject": "<subject id>",
  "title": "Laws of Motion — graded lessons",
  "generatedBy": "model name",
  "materials": [
    {
      "ref": "M1",
      "kind": "lesson",
      "name": "Why things move: force and inertia",
      "level": "easy",
      "tag": "newtons_first_law",
      "durationMins": 35,
      "chapter": "<chapter id>",
      "topics": ["Inertia", "Balanced and unbalanced forces"],
      "content": "# Why things move\n\n…Markdown with $LaTeX$…",
      "keyTerms": [{ "term": "inertia", "definition": "…" }],
      "resources": [
        { "kind": "video", "title": "…", "url": "https://www.youtube.com/watch?v=…", "source": "Khan Academy", "note": "…" },
        { "kind": "article", "title": "…", "url": "https://…", "source": "NCERT", "note": "…" },
        { "kind": "pdf", "title": "…", "url": "https://…/chapter.pdf", "source": "…", "note": "…" }
      ]
    },
    { "ref": "M6", "kind": "examPrep", "name": "Exam preparation: Laws of Motion", "level": "hard", "…": "…" }
  ]
}
```

## What the import writes

- One material per item, in file order, with `order` continuing from the page's last row, `level`,
  `tag`, `durationMins` and `chapter` as given. An exam-preparation sheet gets `type: "Exam prep"`.
- `content` is the Markdown turned into the editor's document (`richTextFromMarkdown`), with a
  "References and further learning" section appended that lists the kept resources as links,
  grouped into videos, reading and PDFs. Markdown links `[text](url)` are supported.
- Each kept resource also becomes a link attachment: videos with `linkType: youtube` (or `video`),
  so the learning app embeds them; PDFs with `fileExtension: pdf`, so the chip shows the PDF icon;
  the publisher in `reference` and the kind in `tag`.

## Why the links are checked server-side

Browsers block cross-origin HEAD requests, and YouTube answers 200 for a watch address whose
video does not exist. The server route fetches with a timeout and a small worker pool, refuses
private addresses, and asks YouTube's oEmbed endpoint whether a video is really public.
