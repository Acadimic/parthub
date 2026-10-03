# Authored content: the editor, the reading view, and everything that feeds them

This is the reference for how authored content — study material, questions, options, solutions —
is written, stored, rendered, imported and exported. It covers `@repo/ui/editor`,
`@repo/ui/content`, and the shared utilities in `@repo/shared/utils` they depend on. The design
rationale lives in `.claude/plans/CONTENT_EDITOR_AND_EQUATIONS.md`; this file records what is
built and how to use it. Updated 2026-10-03 (pronunciation).

## 1. The model in one paragraph

Content is a **ProseMirror document** stored as JSON, wrapped in an `IRichText` envelope with a
plain-text projection beside it. Equations are **atomic nodes carrying LaTeX**, never text. The
teaching app edits the document with Tiptap; every app renders it with React, never `innerHTML`,
except for KaTeX's own output. Markdown is the **interchange format**: models write it, imports
parse it, exports produce it, and nothing edits it in place. The document is canonical.

```ts
interface IRichText {
  format: 'doc/v1'; // RichTextFormat.DOC_V1
  doc: IRichTextDoc; // { type: 'doc', content: IRichTextNode[] }
  text: string; // plain-text projection: search, sort, previews, CSV
}
```

`text` is denormalised on every write by `docToPlainText`; equations appear as their LaTeX. Never
hand-write it and never walk `doc` for a preview — read `text`. `createEmptyRichText()` gives a
fresh empty value (one empty paragraph, because ProseMirror needs a block to put the caret in).

## 2. The two subpaths

| Subpath            | Depends on                | Exports                                                                                                                                                              | Who imports it                                            |
| ------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `@repo/ui/content` | KaTeX (+ mhchem)          | `RichTextView`, `MathRender`, `renderLatex`                                                                                                                          | every app — what a student reads                          |
| `@repo/ui/editor`  | Tiptap 3, MathLive, KaTeX | `RichTextEditor`, `toRichText`, `collectEquations`, `docToMarkdown`, the math and table extensions, `EquationEditor`, `ChemistryEditor`, the symbol and formula data | teaching (and support later) — what a teacher writes with |

`editor` imports from `content`, never the reverse. The editor is heavy, so screens that can be
read without it load it through `next/dynamic`.

```
content/
  MathRender.tsx        one LaTeX string → KaTeX; memoised (500 entries), trust off, mhchem on
  RichTextView.tsx      stored document → React; safe links; unknown nodes fall through as text
editor/
  RichTextEditor.tsx    the Tiptap instance: frame, toolbar, placeholder, projection
  document.ts           toRichText (wrap a doc as a stored value), collectEquations
  markdown/doc-to-markdown.ts   document → Markdown (export). Import lives in @repo/shared.
  toolbar/              EditorToolbar, TableInsertMenu, TableToolbar, ToolbarButton
  extensions/           math-names, math-nodes, MathNodeView, table
  equation/             EquationEditor, SymbolPalette, FormulaGallery, ChemistryEditor, data
```

Shared, in `packages/shared/src/utils/`:

| File                   | What                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `rich-text.util.ts`    | `createEmptyRichText`, `docToPlainText`, `isRichTextEmpty`, `richTextFromMarkdown`, `splitInlineMath`, `repairRichText`                  |
| `latex-repair.util.ts` | `repairJsonEscapes`, `repairLatexControlEscapes`, `repairLeadingLostEscape`, `escapeLatexPercent`, `escapeLatexDollar`, `normaliseLatex` |

## 3. What a document can contain

The schema is Tiptap's StarterKit trimmed and extended. Every node below is edited, rendered,
exported to Markdown and imported from Markdown — all four, or it would be lost on one path.

### Blocks

| Node                                            | Notes                                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `paragraph`                                     |                                                                                                              |
| `heading`                                       | levels **1–3 only**; deeper headings are not admitted                                                        |
| `bulletList`, `orderedList`, `listItem`         | list items hold paragraphs                                                                                   |
| `blockquote`                                    |                                                                                                              |
| `codeBlock`                                     | fenced; contents are literal                                                                                 |
| `horizontalRule`                                |                                                                                                              |
| `hardBreak`                                     | Shift+Enter                                                                                                  |
| `table`, `tableRow`, `tableHeader`, `tableCell` | `bordered` flag on the table; cells hold **inline content only** (no blocks in cells); optional header row   |
| `blockMath`                                     | a display equation; `attrs.latex`                                                                            |
| `image`                                         | a picture block; `attrs.src`, `alt`, `caption`, `width` (`small`, `medium`, `full`). See §3a                 |
| `listening`                                     | a listening passage or dialogue; `attrs.lang`, `mode` (`passage`, `dialogue`), `audio`; paragraphs only. §3b |

### Inline

| Node / mark                                     | Notes                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `text`                                          | with marks                                                                                                               |
| `inlineMath`                                    | an inline equation; `attrs.latex`; atomic, selectable, draggable                                                         |
| `bold`, `italic`, `underline`, `strike`, `code` | marks                                                                                                                    |
| `link`                                          | mark with `attrs.href`; only `http(s):`, `mailto:` and `tel:` are rendered as links, anything else renders as plain text |
| `pronunciation`                                 | mark with `attrs.lang` (BCP-47), `ipa`, `translit`, `audio`; a pronounceable word, phrase or sentence. §3b               |

### 3a. Images

An image is an atomic block node. `src` holds one of three things:

- the **address of an object in our bucket** (`https://<bucket>.s3.<region>.amazonaws.com/<prefix>orgs/<org>/content/<id>`),
  stored without a signature and signed by the reader on display, so the document never expires;
- any other **`https:` address**, shown as it is;
- **`figure:<ref>`**, a placeholder that exists only inside an AI reply until the importer uploads
  the figure and swaps in its address.

The file is never inlined into the document. Uploads go through the host app: `RichTextMediaContext`
(`@repo/ui/contexts`) carries `resolveMediaUrl(src)` and, in the teaching app only,
`uploadImage(file)`. Each app provides it at its root from its own attachment helpers
(`src/hooks/rich-text-media.hook.ts`), because this package must not reach an app's HTTP layer.
Without a provider only plain external `https:` images can be shown, and the editor offers no image
button.

An image is uploaded **the moment it is inserted**, into the organization's `content/` folder, unlike
attachments, which upload when their form saves. That is what lets the document hold a real
address straight away. A picture deleted before the record is saved stays in the bucket with
nothing pointing at it; it is small and not worth a second upload path.

### 3b. Pronunciation

A `pronunciation` mark makes a run pronounceable; a `listening` block wraps paragraphs as a passage
or a dialogue (each paragraph a line, opening with the speaker in bold, which is read but not
spoken). Languages come from `SPEECH_LANGUAGES` in `@repo/shared/utils`. The reader shows a dotted
underline and a speaker; the text opens a card with the transliteration, `/ipa/`, Listen and Slow.

Playback goes through one shared player in `content/speech/` — one sound at a time: a stored
`audio` file first (signed through `resolveMediaUrl`), then the device's voice, otherwise the
control is disabled and says the device has no voice for that language. `audio` is empty by
default; see `.claude/plans/PRONUNCIATION.md` for when audio is generated.

In the editor: the speaker button marks the selection, or the word at the caret
(`Ctrl/⌘ + Alt + P`); its caret wraps the selected paragraphs in a passage or dialogue. With the
caret in a marked run, a second toolbar row edits its language, IPA and transliteration and
previews it. `RichTextEditor`'s `defaultLanguage` sets the language new marks start in — the teaching app
passes the course standard's `locale` (`useSpeechLocale`); without one, the language last picked.

A listening block with `transcript: hidden` is a listening task: the reader shows Play and Slow and
a "Show text" button instead of the lines, so a quiz can ask about what the learner hears. The
editor toggles it on the block (Text shown / Text hidden).

Markdown is Pandoc's: `[Hola]{lang=es-ES ipa="ˈola"}` and `::: listening lang=es-ES mode=dialogue`
… `:::`. `audio` is not written to Markdown.

### Not supported, deliberately

Raw HTML, footnotes, task lists, callouts, toggles, nested tables, headings 4–6, colours
and font sizes. A model or an import that produces any of these gets a paragraph of text instead
(nothing is dropped silently), and the AI prompts tell models not to use them. The plan's
`callout` and `toggle` blocks (§5.10) are not built.

## 4. The editor

`RichTextEditor` takes an `IRichText` (only its `doc` is loaded) and fires `onChange` with a
complete `IRichText`, projection included. Props follow the input-wrapper contract: `label`,
`required`, `error`, `helperText`, `placeholder`, `className`, `editorClassName`.

**Toolbar**: undo/redo · block type (Text, Heading 1–3, Quote, Code block) · Bold, Italic,
Underline, Strikethrough, Inline code · bulleted and numbered lists · table (rows × columns
picker with header-row and borders toggles), image (when the host can upload) and divider ·
Equation (Inline, Display, Chemistry).

**Images**: the toolbar button opens a file picker (PNG, JPEG, WebP, GIF, SVG); pasting or dropping
an image file uploads it too. Selecting an image shows its alt text and caption fields, a
Small / Medium / Full width switch and a remove button. Raster images are compressed to WebP
before upload (`compressImage`). Every image is shown at its natural size, capped by the column
and the chosen width, so a photo never blurs and a small SVG tile (an answer option) stays small;
a generated SVG declares `width` and `height` for this.
Inside a table a second row adds and deletes rows and columns, toggles the header row and the
borders, or deletes the table.

**Keyboard**: the usual `Ctrl/⌘` B, I, U, Z, Shift+Z; `Ctrl/⌘+E` inline equation (with text
selected, converts the selection); `Ctrl/⌘+Shift+E` display equation; Markdown-style input rules
for headings, lists, quotes and code; `$…$` typed inline becomes an equation; `$$` then space
starts a display equation.

**Paste**: `$…$` and `$$…$$` in pasted text become equation nodes; a pasted URL becomes a link
(a typed one does not until the author makes it one).

**Links**: `openOnClick` is off in the editor so a click edits rather than navigates.

**Placeholder**: shown in an empty document; default "Start writing. Ctrl/⌘ + E adds an
equation, or type $x^2$".

**Tables on a phone**: the reading view sizes columns to their content and scrolls a wide table
sideways; a cell never narrows below 6rem, and a first column headed by a short label ("No.",
"#") stays only as wide as its text.

**Rendering**: the content area carries `DOCUMENT_CLASS`, the same typography `RichTextView`
uses, so what an author edits is what a reader sees. Tiptap renders client-side only
(`immediatelyRender: false`) because of the Pages Router.

### Equations in the editor

An equation is a node; clicking it opens the **equation panel** in place (one open at a time).
Enter or clicking away commits, Esc cancels, a blank equation is removed. Header actions: inline
↔ display, duplicate, copy source, show source, on-screen keyboard, delete, cancel, done.

- **Field**: MathLive — a WYSIWYG maths field that produces LaTeX. A teacher never has to see a
  backslash; the LaTeX source is one click away for those who want it.
- **Symbol palette**: grouped, searchable by label, keyword and LaTeX; templates with `#?`
  placeholders that Tab moves between; the last twelve picks lead the list (localStorage).
- **Formula gallery**: complete formulas, searchable, filtered by subject.
- **Chemistry**: a reaction is a chain of species and arrows; arrows carry a direction and a
  condition (Heat, Light, Catalyst…); chips insert state symbols, charges, isotopes, gas and
  precipitate marks. Output is mhchem `\ce{…}`.
- **Commands** (on the math extensions, usable by any host): `insertInlineMath`,
  `insertBlockMath`, `setMathLatex`, `duplicateMath`, `toggleMathDisplayMode`.

### Where it is used

- Teaching: study material content (`UpsertMaterialModal`), question body, options and solution
  (`AddQuestion`, `AddOption`, `AddSolution`), and the **Editor Lab** at `/editor` (see §9).
- Learning: read-only through `RichTextView` (exam questions, options, answers, content view).
- Support: not yet.

## 5. The reading view

`RichTextView` walks the document and renders each node type with React elements. Marks wrap
text in `strong`, `em`, `u`, `s`, `code` or `a`. Unknown node types render their children as text
and unknown marks are ignored, so content is never lost when a newer document meets an older
build. `fallback` renders when the value is empty. Equations go through `MathRender`.

Security: no `dangerouslySetInnerHTML` anywhere except the KaTeX output in `MathRender`, produced
with `trust: false`, so `\href`, `\url` and `\includegraphics` are disabled and an equation cannot
smuggle a link or a remote image. `maxExpand` and `maxSize` bound macro bombs. A link's `href` is
checked against `http(s):`, `mailto:`, `tel:` before it renders as a link.

Images: `RichTextImage` resolves `src` through the media context, shows a pulse while signing,
the image with its caption beneath, and a dashed box with the alt text if it cannot be loaded.

Errors: KaTeX runs with `throwOnError: false`, so a bad expression renders as a red monospace chip
carrying the source and the error in its title, and never takes down the page. `strict: 'ignore'`
keeps it lenient about Unicode in maths.

Performance: `renderLatex` memoises by `(displayMode, latex)` up to 500 entries, cleared wholesale
on overflow. The same formula across sixty rows renders once.

## 6. Markdown in: `richTextFromMarkdown`

The write path for everything that does not come from the editor: AI replies, imports, pastes.
Deliberately narrow — it accepts what the editor can store and turns unknown lines into
paragraphs, so no input is dropped.

| Markdown                                                                         | Becomes                                                              |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `#`, `##`, `###`                                                                 | heading 1–3                                                          |
| blank-line separated text                                                        | paragraphs                                                           |
| `- `, `* `, `+ `                                                                 | bullet list                                                          |
| `1. `, `1) `                                                                     | ordered list                                                         |
| `> `; a quoted `- ` or `1. ` list stays a list                                   | blockquote                                                           |
| ` ``` ` fences                                                                   | code block                                                           |
| `---`, `***`, `___`                                                              | horizontal rule                                                      |
| GFM pipe table (header row, separator, body rows); `<br>` in a cell              | table, bordered, header row; `<br>` is a hard break                  |
| `$$…$$` on one line, or a `$$` … `$$` block over several lines; `\[…\]` likewise | display equation                                                     |
| `$…$`, `\(…\)`, `$$…$$` inside a line                                            | inline equation                                                      |
| `**bold**`, `_italic_` or `*italic*`, `***both***`, `~~strike~~`, `` `code` ``   | marks                                                                |
| `[text](https://…)`                                                              | link mark                                                            |
| `\$`                                                                             | a literal dollar sign                                                |
| `![alt](src "caption")` alone on a line; `src` is `https:` or `figure:<ref>`     | image                                                                |
| `[text]{lang=es-ES ipa="ˈola" translit=…}` (a `lang` is required)                | pronunciation mark                                                   |
| `::: listening lang=… mode=passage\|dialogue [transcript=hidden]` … `:::`        | listening block; anything but paragraphs inside is flattened to text |

Rules worth knowing:

- **`$` follows Pandoc's rule.** It opens an equation only when followed by a non-space, and
  closes one only when preceded by a non-space and not followed by a digit. So "costs $5000 at 8%
  and returns $800" has no equation in it, while "$x = 5$" does. Inside a code span nothing is an
  equation.
- **Marks are parsed before equations**, so `**Answer: $x$ and $y$**` is one bold run with two
  equations in it.
- **Every equation is normalised** (`normaliseLatex`): control characters that were lost
  backslashes are restored (`<TAB>imes` → `\times`), a command that lost its first letter at the
  start is restored (`rac{a}{b}` → `\frac{a}{b}`), a bare `%` becomes `\%` (otherwise it is a
  LaTeX comment), a bare `$` becomes `\$` (a price inside an equation), and whitespace is trimmed.
- **`*italic*`** counts only when the stars hug a word on both sides, so `a*b` and `2 * 3` stay
  text or maths.
- **Not imported**: `<u>` underline, an
  image inside a paragraph or with any other scheme (it stays text), HTML, nested lists, task
  lists, hard breaks.

## 7. Markdown out: `docToMarkdown`

The export path, and what proves the stored JSON is a document rather than a private encoding.
Every node in §3 serialises: headings, marks in a fixed order (`**_x_**` and `_**x**_` are the
same document and must be the same string), underline as `<u>…</u>` (Markdown has none), lists,
quotes, fenced code, rules, pipe tables (with `|` escaped in cells), `$…$` and `$$\n…\n$$`,
`---`, images as `![alt](src "caption")` (width is not expressible and comes back as `full`), and
hard breaks as a backslash before the newline (as `<br>` inside a table cell). Bare `$` in prose is escaped as `\$` so
a re-import does not invent an equation.

The AI-safe subset — what round-trips `doc → Markdown → doc` exactly — is everything in §3 except
underline (exported as HTML the importer does not read) and hard breaks.

## 8. The AI path, end to end

Models write **Markdown inside a JSON envelope**; the app parses, checks, converts and imports.
The generators live in `apps/teaching/src/utils/ai/` and are documented in
`TEST_PAPER_GENERATOR.md` and `STUDY_MATERIAL_GENERATOR.md` there. What matters to content:

1. **The prompt** states the Markdown subset above (`MARKDOWN_RULES` in `common.ts`), asks for
   `$…$` and `$$…$$` only, `20\%` inside maths, `\$5000` for money, and **doubled backslashes**
   inside JSON strings — because `"\frac"` in JSON is a form feed followed by `rac`.
2. **Before parsing**, `repairJsonEscapes` doubles every backslash that is not a JSON escape
   (`\pi`, `\div`, `\(`), and doubles `\b \f \n \r \t` when the letters after them spell a LaTeX
   command, so a real line break survives. The count is shown to the teacher as a warning.
3. **Validation** (`checkMarkdownMath`) warns on leftover control characters, currency `$`, an odd
   number of `$`, and `\( \)` delimiters.
4. **Figures**: a reply may draw pictures as SVG in `figures: [{ ref, alt, caption, svg }]`,
   placed as `![alt](figure:<ref>)`. `checkFigures` refuses an undefined ref and an SVG with a
   script, an event attribute, foreign content, an external link or resource, no `viewBox`, or more
   than 200 kB. Once a reply passes, the importer uploads each figure (`uploadReplyFigures` in the
   CLI, `uploadAiFigures` + `withFigureSources` in the teaching app's drawers) and points the image
   at the stored file. The prompts' "Figures" section (`FIGURE_RULES`) tells the model all of this.
5. **Pronunciation**: for a language course (its standard has a `locale`) the prompt asks for
   pronunciation spans and listening blocks (§3b); `checkPronunciation` warns on a span with no
   `lang`, an unknown code, or a block left open.
6. **Conversion** is `richTextFromMarkdown`, with the normalisation of §6.
7. **Import** writes `IRichText` values through the bulk routes.

Content imported before these safeguards existed can be repaired in place with **Repair
equations** on a subject's material page (header button for every content, card menu for one).
`repairRichText` restores commands, escapes `%` and `$`, turns parenthesised equations that lost
their `\(` back into nodes, re-joins a paragraph a `\n` inside an equation had split, converts prose
swallowed into an equation back to text, re-pairs bold that was split around an equation, and
also turns a quote whose list was flattened into one line (`- a - b - c`, how older imports stored
"Important notes") back into a bulleted list. It returns how many places changed.

## 9. The Editor Lab (`/editor` in the teaching app)

A scratch page for trying the editor on preset documents and seeing the same document as the
reading view, as Markdown, as JSON, and as TOON (Token-Oriented Object Notation — the JSON encoded
for a model, to make the token cost of structure visible). It also hosts `MathFieldPlayground`
for the bare MathLive field. Nothing on it is saved.

## 10. Storage and validation

`RichTextDto` (`packages/shared/src/dtos/validations/rich-text.dto.ts`) validates the envelope:
`format` is the enum, `doc` is an object, `text` is a string. The server does **not** yet rebuild
the tree against the schema (`Schema.nodeFromJSON`), which the plan calls for; a client can store
a node type the apps do not know, and the reading view will render it as text. Fields holding
content: `Material.content`, a question's `body` and the `body` of each of its options and its
solution, and `TestPaper.instruction`.

## 11. Adding things

- A **symbol**: one entry in `equation/symbols.ts`, with `keywords` for what a teacher would type.
- A **formula**: one entry in `equation/formulas.ts` with a `subject`.
- A **chemistry chip** or **arrow condition**: `CHEMISTRY_INSERTS` / `ARROW_CONDITIONS` in
  `equation/chemistry.ts`.
- A **node type**: an extension under `extensions/`, a renderer in `content/RichTextView.tsx`, a
  serializer entry in `markdown/doc-to-markdown.ts`, and a reader in
  `@repo/shared/src/utils/rich-text.util.ts` — all four, or the type is lost on one path. Then add
  it to the AI prompts' rules and to §3 here.
- An **equation action**: a command on `extensions/math-nodes.ts` and a `PanelButton` in
  `equation/EquationEditor.tsx`.
- A **repair** for a new way content arrives broken: a pure function in `latex-repair.util.ts`,
  wired into `normaliseLatex` (equations) or `repairRichText` (stored documents), with a case in
  the scratch checks before shipping.

## 12. Known gaps

- Server-side structural validation of `doc` (§10).
- Hindi and other Indic text inside `\text{}` renders through KaTeX's fallback fonts; not yet
  verified on devices (plan §6.6, §6.10).
- An image's width does not survive Markdown. Images inside table cells or list items are not
  supported (the node is a block).
- The Notion-style block chrome of the plan (drag handles, slash menu) is not built; the toolbar
  is the whole UI.
- `<u>` is not imported from Markdown.
