# `@repo/ui/editor` and `@repo/ui/content`

Authored content — study material, questions, options, solutions — is a ProseMirror document
(`IRichText` in `@repo/shared`) with equations as atomic nodes. Two subpaths split what a teacher
needs to write it from what a student needs to read it:

| Subpath            | Depends on              | Who imports it                                 |
| ------------------ | ----------------------- | ---------------------------------------------- |
| `@repo/ui/content` | KaTeX                   | every app — `RichTextView`, `MathRender`       |
| `@repo/ui/editor`  | Tiptap, MathLive, KaTeX | teaching and support — `RichTextEditor` and co |

`editor` imports from `content`, never the reverse. The plan behind the design is
`.claude/plans/CONTENT_EDITOR_AND_EQUATIONS.md`.

## Layout

```
content/
  MathRender.tsx        one LaTeX string → KaTeX, memoised, trust off, mhchem on
  RichTextView.tsx      stored document → React; no innerHTML anywhere
editor/
  RichTextEditor.tsx    the Tiptap instance: frame, toolbar, placeholder, projection
  document.ts           toRichText (wrap a doc as a stored value), collectEquations
  markdown/
    doc-to-markdown.ts  document → Markdown, the export path (import is in @repo/shared)
  toolbar/
    EditorToolbar.tsx   undo/redo · block type · marks · lists · table · equation
    TableInsertMenu.tsx the rows × columns picker with header-row and borders toggles
    TableToolbar.tsx    the row shown while the caret is in a table: rows, columns, borders
    ToolbarButton.tsx   the controls the toolbar is built from
  extensions/
    math-names.ts       'inlineMath' / 'blockMath' — a rename is a stored-document migration
    math-nodes.ts       the two nodes: commands, shortcuts, input rules, paste rules
    MathNodeView.tsx    click-to-edit in place; one open editor at a time
    table.ts            Tiptap's table with a `bordered` flag, and the insert command
  equation/
    EquationEditor.tsx  the panel: field, header actions, symbols, formulas, source
    SymbolPalette.tsx   searchable, grouped, with the author's recent picks first
    FormulaGallery.tsx  searchable complete formulas, filtered by subject
    ChemistryEditor.tsx reactants → arrow → products, with state symbols and charges
    symbols.ts          the palette taxonomy — data
    formulas.ts         the gallery — data, the seed for a per-subject gallery later
    chemistry.ts        the mhchem model: parse / build arrows and reaction chains
    recent-symbols.ts   the localStorage-backed Recent group
    panel-controls.tsx  the small controls the panel and its popovers share
```

## What the editor does for an equation

- **Insert**: toolbar (Inline · Display · Chemistry), `Ctrl/⌘+E` and `Ctrl/⌘+Shift+E`, `$…$`
  typed inline, `$$` then space for a display equation. With text selected, Inline converts
  the selection into an equation.
- **Paste**: `$…$` and `$$…$$` in pasted text become equation nodes.
- **Edit**: click the equation; it opens in place. Enter or clicking away commits, Esc cancels
  back to the previous value, a blank equation is removed rather than kept.
- **Header actions**: inline ↔ display, duplicate, copy source, show source, on-screen keyboard
  (chemistry hides it), delete, cancel, done.
- **Palette**: templates with `#?` placeholders; Tab moves between boxes. Search covers labels,
  keywords and the LaTeX itself. The last twelve inserted symbols lead the list.
- **Tables**: pick rows × columns from the grid, with or without borders and a header row. Inside
  a table a second toolbar row adds and deletes rows and columns, toggles the header row and the
  borders, or deletes the table. Markdown export writes a pipe table; import reads one back.
- **Chemistry**: a reaction is a chain of species and arrows. Arrows carry a direction and a
  condition (with one-click Heat, Light, Catalyst…). Chips insert state symbols, charges,
  isotopes, gas-evolved and precipitate marks at the caret.

## Adding things

- A **symbol**: one entry in `symbols.ts`. Give it `keywords` for the words a teacher would type.
- A **formula**: one entry in `formulas.ts` with a `subject`.
- A **chemistry chip** or **arrow condition**: `CHEMISTRY_INSERTS` / `ARROW_CONDITIONS` in `chemistry.ts`.
- A **node type**: an extension under `extensions/`, a renderer in `content/RichTextView.tsx`,
  a serializer entry in `markdown/doc-to-markdown.ts`, and a reader in
  `@repo/shared/src/utils/rich-text.util.ts` — all four, or the type is lost on one path.
- An **equation action**: a command on `math-nodes.ts` and a `PanelButton` in `EquationEditor.tsx`.
