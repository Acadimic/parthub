# Content Editor, Mathematical Equations and Multilingual Content

Status: proposal, 2026-09-15. Supersedes `multilingual-content-equations-architecture.md`
(the "AbleSpace" draft), which is reviewed in §3 and folded in here.

Scope confirmed with Manish: **this repo** (`parthhub-app`, not a separate product),
**structured JSON in MongoDB** as the canonical form, and **all three workstreams in
scope** — rich text editing, visual equation authoring, and the multilingual/translation
workflow. The phases in §14 are a delivery order, not a reduction of scope.

---

## 1. What this has to achieve

One sentence, because everything below is subordinate to it:

> A teacher who has never heard of LaTeX must be able to write
> `x = (-b ± √(b² − 4ac)) / 2a` into a question, see it typeset correctly, come back
> a week later, click it, change the `4ac` to `4ab`, and save — without ever seeing a
> backslash, and without the caret jumping somewhere unexpected.

Everything that follows is judged against that sentence. The second requirement — the
same content in Hindi, Sanskrit and other languages — is real but secondary, because a
translation workflow over an authoring experience nobody can use is worth nothing.

---

## 2. Verdict on the editor that exists today

I read all ~6,600 lines under `apps/teaching/src/components/editors/` and the duplicated
copy under `apps/learning/src/components/editors/`. The instinct behind it is sound; the
architecture cannot be made to work. Concretely:

**2.1 The caret is state the editor does not own.**
`TextEditor.tsx` wraps `react-contenteditable` and addresses blocks by array index.
Every structural change re-renders the list, the browser drops the selection, and the
code tries to put it back by hand. The evidence is in the file: `saveSelection` /
`restoreSelection` are written and then commented out
(`TextEditor.tsx:18-30`), `focusAtEnd` has its caret-placement half commented out
(`TextEditor.tsx:59-75`), and `MathEditor` carries a `renderFocus` boolean that is
toggled purely to force a re-focus (`MathEditor.tsx:22`, flipped in four handlers).
That is not a bug to fix. It is what happens when the document model and the DOM
selection are two separate sources of truth.

**2.2 Typing is debounced by 500 ms.**
`TextEditor.tsx:45-48`. The model lags the screen by half a second, which means a save
fired quickly after typing loses the tail of the input, and any derived UI (preview,
validation, character count) is always stale.

**2.3 Nesting requires modals inside modals.**
`EquationToolbar` opens a dialog per function — `Fraction.tsx`, `Root.tsx`,
`Matrix.tsx`, `Integral.tsx`. A fraction's numerator is itself `EquationBlock[]`
(`types.ts`, `FractionNode`), so writing `\frac{\sqrt{x+1}}{2}` means opening the root
dialog from inside the fraction dialog. In practice that expression is unauthorable.
This is the single biggest reason the editor "doesn't feel good": the common case
(nested math) is the case the UI is worst at.

**2.4 Serialization is one-way.**
`serializeEquation` (`util.tsx:45-70`) turns the AST into LaTeX. Nothing turns LaTeX
back into the AST. So the bespoke `EquationBlock` union is permanently canonical:
content cannot be pasted in from anywhere, imported from anywhere, or moved to another
tool. Every future feature has to be re-implemented against that AST.

**2.5 There is no history model.**
`EditorContentType.UNDO` and `.REDO` exist in the enum (`types.ts:5-6`) with nothing
behind them. Ctrl+Z inside a `contentEditable` span does browser-level undo on the DOM
while the React state stays where it was — the two desynchronise immediately.

**2.6 It is duplicated and drifting.**
`types.ts` and `util.tsx` exist in both `apps/teaching` and `apps/learning`
(teaching's `util.tsx` is 451 lines, learning's is 274). The read path and the write
path are already different implementations of the same format.

**2.7 It renders author-supplied HTML with `dangerouslySetInnerHTML`.**
`util.tsx`, `renderTextBlock` — `dangerouslySetInnerHTML={{ __html: block.content }}`,
where `block.content` is `innerHTML` harvested from a `contentEditable`
(`TextEditor.tsx:55`) and stored verbatim. `apps/learning/src/components/others/Html.tsx`
puts the same content on a student's screen. A teacher (or anyone who can reach the
question API) can store `<img src=x onerror=...>` and it executes in every student's
session. **This is a live stored-XSS hole and should be treated as a security fix with
its own timeline, independent of this plan** — see §12.

**2.8 There are no tests.** No `*.spec.ts` or `*.test.ts` anywhere in the repo, and no
test script in any workspace. A format conversion project cannot be done safely without
at least round-trip tests; §13.

### What to keep

Not all of it goes in the bin. Three things are genuinely valuable and carry forward:

| Keep | Why | Becomes |
| --- | --- | --- |
| `serializeEquation()` in `util.tsx` | It is a correct, complete `EquationBlock → LaTeX` mapping | The **migration converter** (§11). It is the only thing that can read the old format. Do not delete it until the backfill has run and been verified. |
| `FunctionType` (`packages/shared/src/enums/editor.enum.ts`) | It is a curated list of what these teachers actually insert — chemical equations, unit vectors, determinants, transparent tables | The **palette taxonomy** (§5.3). It encodes real product knowledge that a generic symbol picker would lose. |
| `ChemicalEquation*.tsx`, `UnitVector.tsx`, `Draw.tsx`, `UploadImage.tsx` | They reveal requirements not in either plan document: chemistry notation, hand-drawn diagrams, pasted images | Explicit requirements, each mapped in §6.4 and §15. |

Everything else — `MathEditor`, `EquationEditor`, `TextEditor`, `EditorToolbar`,
`EquationToolbar`, the per-function modals, the `Block`/`EquationBlock` union — is
deleted at the end of Phase 5.

---

## 3. Review of `multilingual-content-equations-architecture.md`

### 3.1 What the document gets right, and I am keeping

- **Structured JSON canonical, Markdown as import/export** (§7, §27, §28). Correct, and
  the most important call in the document. An equation must be an *atomic node* the user
  cannot break by typing; in Markdown it is text between `$$` delimiters that a backspace
  corrupts. Also, `$` is a currency symbol — "the book costs $5 and the pen costs $3"
  becomes an equation in any Markdown-canonical system, and you end up teaching escaping
  rules to exactly the users who must never see them. §4 of this plan expands on this.
- **LaTeX as the equation representation** (§6, §35). Correct. It is the only math
  notation with universal tooling, it round-trips, and it is what every renderer,
  exporter and future AI integration already understands.
- **KaTeX for rendering** (§3). Correct, and a real improvement over the `better-react-mathjax`
  currently in `apps/learning` and `apps/teaching` — see §6.5 for why and what it costs.
- **Separate translation documents rather than one polyglot document** (§11). Correct.
- **`sourceVersion` for stale-translation detection** (§17). Right idea; the mechanism as
  drawn has a hole — §9.2.
- **Do not translate LaTeX** (§26). Right in principle, wrong in detail — §9.4.
- **Deferring sentence-level translation units** (§19). Agreed, and I would defer them
  harder: they are a translation-memory feature, and translation memory is a product
  decision, not an architecture decision.

### 3.2 What I am changing

**(a) Inline math is missing from the schema.** The document's equation node (§6) is a
block-level sibling of `paragraph`. But §2 of the same document shows `The value of $x$
is 5` — inline math, inside a paragraph. These are two different ProseMirror nodes with
different schema groups (`inline` vs `block`), and retrofitting the inline one later
means a second content migration. **Two nodes from day one**: `inlineMath` and
`blockMath`. See §6.2.

**(b) "Visual equation editor" is the whole problem, and the document treats it as a
bullet.** §4 says "open a visual equation editor, select fractions, roots, powers,
preview, insert". That describes precisely the modal-palette design that already failed
(§2.3). The recommendation needs to be specific about *which* interaction model, because
there are three and only one of them works. See §4 and §5.

**(c) `contents` + `content_translations` is a new CMS that does not map onto this
repo.** The document proposes a generic content system with types
`lesson | activity | assessment | article | template`. None of those exist here. What
exists is `Question.question`, `Option.option`, `Solution.solution` and
`Material.content` — four string fields on four collections, each currently holding
`JSON.stringify(Block[])`. Introducing a parallel CMS would mean the editor work is
blocked behind a content-model migration that has nothing to do with equations.
**Instead: a reusable `IRichText` value object that drops into the existing entities**
(§8), with translations layered on as a sibling collection keyed by
`(entity, entityId, language)` rather than a new document type. Same end state, no
detour.

**(d) The rendering path is unspecified, and it is the expensive one.** Three surfaces
render this content: teaching (authoring and preview), learning (every student, every
question, every material) and printed test papers. Nothing in the document prevents a
student's bundle from pulling in ProseMirror *and* MathLive — roughly a third of a
megabyte of editor that a reader never uses. **The renderer must be a separate entry
point from the editor** (§6.1), and the editor must be dynamically imported.

**(e) No migration plan.** There is existing content in the old format, and some of it
predates even that: `getBlocks()` (`util.tsx:384`) branches on
`html.startsWith('[')`, which means rows in the database are *either* a JSON `Block[]`
array *or* a bare HTML string. Any plan that doesn't say how both become the new format
is not yet a plan. §11.

**(f) Unique index will collide with soft deletes.** §15 of the document proposes
`index({ contentId: 1, language: 1 }, { unique: true })`. Every collection in this repo
soft-deletes (`BaseSchema._deleted`, plus the two global connection plugins). Delete a
Hindi translation and recreate it and the unique index rejects the insert, because the
old row is still there with `_deleted: true`. It must be a partial index — §9.3.

**(g) Org scoping is missing on the translation collection.** The document puts
`organizationId` on `contents` only. Every org-owned collection here extends
`BaseSchema` (which makes `org` required and immutable) and every read filters by org;
see the `query-with-mongoose` skill. A translation document is org-owned too.

**(h) Accessibility is listed under "Future Enhancements" (§34).** For an education
product, screen-reader-navigable math is not a future enhancement, and with the tools
recommended here it is close to free — KaTeX already emits MathML alongside its HTML,
and MathLive speaks expressions aloud. Moving it into V1 costs configuration, not
engineering. §6.7.

### 3.3 What is missing entirely

Paste from Word and Google Docs (§5.6) · equation error states (§5.7) · the LaTeX escape
hatch for the teachers who *do* know LaTeX (§5.8) · Devanagari inside equations, which
does not work out of the box (§6.6) · render performance on a 60-question paper (§6.8) ·
print/PDF fidelity (§6.9) · KaTeX's stricter parser vs the MathJax in use today (§6.5) ·
chemistry notation, which the repo already has a feature for (§6.4) · security (§12) ·
tests (§13).

---

## 4. The one decision that matters: do not build the equation editor

There are exactly three interaction models for authoring math, and the choice between
them determines whether this project succeeds.

**Model A — a LaTeX source box.** The user types `\frac{-b \pm \sqrt{b^2-4ac}}{2a}`.
Correctly rejected by the existing plan. Excluded for the primary flow; retained as a
disclosure for power users (§5.8).

**Model B — a palette of templates, each filled in through a dialog.** Click "Fraction",
a modal opens with a numerator field and a denominator field, fill them in, press Insert.
This is Word's *legacy* equation editor, and it is what `apps/teaching` builds today. It
fails on nesting (§2.3), it fails on editing (you must reopen the dialog tree to change
one character), and it produces a stop-start rhythm that makes writing a paragraph
containing four small expressions genuinely unpleasant.

**Model C — a live math field, where the typeset equation *is* the editable surface.**
You type `1/2` and it becomes a fraction as you type. You press `/` and a fraction frame
appears with the caret in the numerator. Arrow keys walk into and out of the fraction.
A palette inserts a *template with empty boxes* and the caret lands in the first one;
Tab moves to the next. An on-screen math keyboard covers everything you cannot type.
This is Word's modern equation editor, Desmos, and Khan Academy's answer input. **It is
the only model that satisfies §1.**

Model C is perhaps six to eighteen months of work to build well — caret movement through
nested structures, selection across structure boundaries, bidirectional LaTeX, an
on-screen keyboard, IME and touch handling, screen-reader output. It is also a solved
problem with a mature MIT-licensed implementation.

### The recommendation

**Use MathLive (`mathlive`, v0.110.0, MIT) as the equation field. Do not write one.**

It is a standards-based web component (`<math-field>`), so it is framework-agnostic,
works under React 19 (which — unlike React 18 — passes props to custom elements
correctly), and drops into a `packages/ui/src/core` wrapper like any other primitive.
What it provides, all of which maps directly onto requirements in §1 and §5:

- The typeset equation is the edit surface; arrow keys navigate nested structure.
- **Placeholders and tab-stops** (`\placeholder{}`, `#?` in a template) — the mechanism
  that makes a palette usable *without* a dialog. This is the direct fix for §2.3.
- **A customisable on-screen math keyboard.** For a non-technical user, and for anyone on
  a tablet, this is the single most important feature in the whole plan. Layouts are
  data, so "Class 8 Algebra" and "Chemistry" keyboards are configuration.
- **Inline shortcuts** — typing `sqrt` becomes `√`, `pi` becomes `π`, `<=` becomes `≤`,
  `/` opens a fraction. Teachers type the way they think and get correct notation.
- Real undo/redo, selection, cut/copy/paste.
- **Bidirectional LaTeX** (`mf.value`), plus MathML and ASCIIMath in and out. This is what
  makes LaTeX safely canonical and ends the lock-in of §2.4.
- Screen-reader support and spoken math, which delivers §3.2(h) as configuration.

Alternatives considered: **MathQuill** — the original of this genre, still widely used,
but jQuery-coupled and slow-moving; MathLive is its successor in every respect.
**MathType** (WIRIS) — excellent, includes handwriting recognition, but commercial and
per-seat; revisit only if handwriting input (§15) becomes a hard requirement.
**Building it** — see above.

Cost to be honest about: MathLive is a large dependency (roughly 200–300 KB plus fonts)
and it is essentially a one-maintainer project. Both are handled: it is **editor-only and
lazily loaded**, so it never reaches a student's bundle (§6.1); and because it reads and
writes plain LaTeX, replacing it later touches one component and no stored data. That is
the real payoff of LaTeX-as-canonical — the field is swappable.

---

## 5. The experience: editor and reading view

This section is the specification the UI is built against. It is deliberately concrete,
because "user-friendly" is not a requirement anyone can implement.

Two surfaces, and the relationship between them is the point:

- **The editor is a Notion-style block editor** — hover gutters, drag handles, a slash
  menu, inline Markdown shortcuts — with equations as first-class blocks (§5.10, §5.11).
- **The reading view looks like a rendered Markdown document** — the typography of a
  well-set `.md` file, with real math (§5.12).

And they share one stylesheet (§5.13), so what an author edits is literally what a reader
sees. That is what makes Notion feel trustworthy, and it costs nothing here beyond
deciding it up front.

One clarification, because "it should look like we are viewing an md file" and
"canonical is JSON" sound like they conflict and do not: **"reads like Markdown" is a
presentation requirement, not a storage one.** GitHub stores your README as a file and
renders it to styled HTML; we store a document as JSON and render it to the same styled
HTML. The reader cannot tell, and we keep atomic equation nodes, real schema validation,
and a translation model — none of which survive a string.

### 5.1 Inserting an equation

Three entry points, all reaching the same place:

- The `∑` button in the editor toolbar.
- `/equation` as a slash command in the body (also `/eq`, `/math`, `/fraction`).
- `Ctrl` / `⌘` + `E`.

Insertion creates an **empty inline equation at the caret** with the math field focused
and the palette open. Inline vs display (block, centred, on its own line) is a toggle in
the equation's bubble toolbar, not a separate choice up front — the author writes first
and decides presentation after, which is the order they actually think in.

### 5.2 Typing

The math field is live. Notable behaviours to configure and then verify by hand:

| The author types | They get |
| --- | --- |
| `1/2` | a proper stacked fraction |
| `x^2` | x squared |
| `x_1` | x subscript 1 |
| `sqrt` | a radical with the caret inside |
| `pi`, `theta`, `alpha` | π, θ, α |
| `<=`, `>=`, `!=`, `+-` | ≤, ≥, ≠, ± |
| `->` | → |
| `Tab` | jump to the next empty box |
| `←` `→` | walk through the structure, including into and out of a fraction |
| `Esc` | leave the equation, caret back in the paragraph |

### 5.3 The palette

Grouped by **what a teacher is trying to write**, not by LaTeX primitive. This is where
the existing `FunctionType` enum earns its keep. Proposed groups:

`Basic` · `Fractions & roots` · `Powers & indices` · `Greek letters` ·
`Relations & operators` · `Brackets` · `Trigonometry` · `Calculus` (limits, integrals,
derivatives, Σ, Π) · `Matrices & determinants` · `Vectors` · `Sets & logic` ·
`Geometry` (angle, triangle, parallel, perpendicular, degree) · `Chemistry` ·
`Units`.

Every palette item inserts a **template with empty placeholder boxes**, never a dialog.
Insert a fraction and you get an empty fraction with the caret in the numerator; Tab goes
to the denominator. That one change is the difference between the current editor and a
usable one.

A **Recent** group holds the last twelve symbols this user inserted, persisted per user.
In practice a maths teacher uses fifteen symbols for a whole term; this removes most of
the hunting.

### 5.4 The formula gallery

Distinct from the palette and, I suspect, the highest-value item in the plan for the
stated audience. A searchable list of **complete, named formulas**, inserted whole and
then edited in place:

> Quadratic formula · Pythagoras' theorem · Area/circumference of a circle · Slope ·
> Distance formula · Compound interest · sin²θ + cos²θ = 1 · Binomial expansion ·
> nth term of an AP/GP · Ohm's law · v = u + at · E = mc² · Ideal gas law ·
> Photosynthesis (as a chemical equation)

A teacher thinks "I need the quadratic formula", not "I need a fraction containing a plus-
minus and a square root". The gallery should be **data, seeded per standard/subject and
extensible by the support app**, so it grows without a deploy — this is a natural fit for
the existing `apps/support` and its `standard`/`subject` stores.

### 5.5 The on-screen math keyboard

Toggled by a keyboard button on the field; **on by default on touch devices**. This is
non-negotiable for tablet authoring, and it is the answer for any author who is not
confident with a physical keyboard. Layouts are configured per context (a chemistry
keyboard for a chemistry paper).

### 5.6 Editing an existing equation — the core requirement

**Click the equation. It becomes editable in place.** The same field, the same palette,
the same keyboard. There is no modal, no "edit equation" dialog, and no raw LaTeX.
`Esc` cancels back to the previous value; clicking away or pressing `Enter` commits.
Hovering shows a small bubble toolbar: *inline/display toggle · duplicate · delete ·
`</>` (LaTeX) · copy as image*.

That behaviour is what the ProseMirror node view buys us: the equation is one atomic
node, so it cannot be half-deleted by a stray backspace, and a click on it is
unambiguous. In a Markdown-canonical design it is a text range between two `$$`, and all
of the above becomes guesswork.

Paste is part of this requirement and is missing from both plans: **Word and Google Docs
put MathML on the clipboard**, and MathLive parses MathML. Paste handling should try, in
order, MathML → LaTeX-with-delimiters → plain text. Teachers will paste from existing
question banks on day one, and if that produces garbage they will not use the tool.

### 5.7 When an equation is wrong

It is defined behaviour, not an accident:

- The node stores the LaTeX regardless; invalid LaTeX is never silently discarded.
- In the editor, an unrenderable equation shows as a **warning chip with the raw source
  and a "Fix equation" affordance** — never blank, never a crash, never a red React
  error overlay.
- Saving a document containing an invalid equation warns but does not block; blocking the
  save is how people lose an hour of work.
- On the student-facing surface an unrenderable equation renders as its source in a
  monospace chip, and is logged. A student must never see a blank space where a question
  was.

### 5.8 The LaTeX escape hatch

A `</>` toggle in the bubble toolbar reveals a monospace LaTeX input, two-way bound to
the field. Hidden by default.

This matters more than it sounds. A significant minority of maths and physics teachers
*do* know LaTeX, and an editor that makes them click through a palette to write something
they could type in four seconds will be actively resented. Supporting both costs one
input box.

### 5.9 Block editing — the Notion model

Tiptap is the right foundation for this specifically: a Notion-style editor is a
block-structured document with per-block chrome, which is what ProseMirror's model and
node views are for. None of the below is exotic; it is what the library is designed to
express.

**The block gutter.** Hovering any block reveals two controls in the left margin:

- `⊕` — insert a new block below, opening the same menu as `/`.
- `⠿` — drag to reorder; **click** to open the block menu: *Turn into · Duplicate ·
  Copy link to block · Move to · Delete.* "Turn into" is how a paragraph becomes a
  heading, a quote, a callout or a list without retyping it.

Blocks reorder by drag, with a drop indicator between blocks. Multi-block selection drags
as a group.

**The slash menu.** `/` in an empty block — or anywhere in a block — opens a filtered,
keyboard-navigable command list, grouped:

> **Basic** — Text · Heading 1/2/3 · Bulleted list · Numbered list · To-do list ·
> Toggle · Quote · Callout · Divider
> **Math & science** — Inline equation · Block equation · Chemical equation ·
> Formula gallery
> **Media** — Image · Table · Code

Typing narrows it (`/eq`, `/h2`, `/tab`). Enter inserts. Escape dismisses without leaving
a stray `/`.

**The selection toolbar.** Selecting text floats a bubble: *Turn into · Bold · Italic ·
Underline · Strikethrough · Code · Link · Equation.* That last one is worth noting —
**selecting `x^2+1` and pressing the equation button converts the selection into an
inline equation in place**, which is how an author who has already typed something
mathematical promotes it without retyping.

**Markdown input rules — the bridge between your two asks.** The author types Markdown
and gets blocks, exactly as Notion does. This is how Markdown fluency shows up in the
product without Markdown being the storage format:

| Typed at the start of a block | Becomes |
| --- | --- |
| `# `, `## `, `### ` | Heading 1 / 2 / 3 |
| `- ` or `* ` | Bulleted list |
| `1. ` | Numbered list |
| `[] ` | To-do item |
| `> ` | Quote |
| ` ``` ` | Code block |
| `---` | Divider |
| `\|\|\| ` | Toggle |

…and inline, mid-sentence: `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`.

**The two that matter most here:**

| Typed | Becomes |
| --- | --- |
| `$ … $` | an **inline equation node**, converted on the closing `$` |
| `$$` then Enter | a **block equation**, with the math field focused |

This is the single cheapest thing in the whole plan and it serves both audiences at once.
The teacher who knows Markdown and a little LaTeX types `$x^2$` and keeps going. The
teacher who knows neither presses `/` and picks *Inline equation*. Both land on exactly
the same node, and neither is second-class.

**Keyboard semantics**, which are what make a block editor feel finished:

- `Enter` — new block. `Shift+Enter` — soft line break inside the block.
- `Backspace` at the start of a styled block → turn into plain text; again → merge into
  the block above.
- `Tab` / `Shift+Tab` — indent / outdent a list item.
- `Esc` — select the whole block as a node; arrow keys then move between blocks.
- `Cmd/Ctrl+Z` — one undo stack across the document and the math fields.
- An empty paragraph shows a muted placeholder: *Type '/' for commands.*

**What we are deliberately not copying from Notion:** databases, page-in-page nesting,
synced blocks, comments and mentions, and the page-level sidebar. Those are Notion being
a workspace; we are an editor inside an existing product with its own navigation.

### 5.10 The block set

The V1 node list from §6.2, revised for the Notion model. Four additions, each earning
its place in a teaching product rather than copied for completeness:

| Block | Why it is in V1 |
| --- | --- |
| **Callout** | *Note · Remember · Example · Warning.* Study material is full of these, and without a block for it authors fake them with bold paragraphs that then translate and export badly. |
| **Toggle** (collapsible) | **The best fit for this product in the whole list.** A worked solution, a hint, or an answer hidden behind a toggle in study material — the student expands it when they are ready. Today that needs a separate `Solution` entity or nothing at all. |
| **To-do list** | Checklists in revision material and lab procedure. Cheap, since it is `listItem` with a boolean. |
| **Divider** | Section breaks in long material. Trivial, and Markdown round-trips it exactly (`---`). |

Everything else is as §6.2: paragraph, headings 1–3, bulleted and numbered lists, quote,
code, image, table, horizontal rule, plus `inlineMath` and `blockMath`.

Still deliberately out: nested tables, footnotes, columns, synced blocks, embeds.

### 5.11 The reading view reads like a rendered Markdown document

This is a typography specification, and it is worth writing down because "make it look
like a document" is otherwise interpreted five different ways by five people.

The target is what a well-set `.md` file looks like rendered — GitHub, or a good static
site — not what an app chrome looks like:

- **One measure.** Body text at roughly 68 characters. Not full-bleed, not a card.
- **A real type scale**, from `uiPreset`. Headings step down clearly and carry more space
  above than below, so a heading binds to the text it introduces.
- **Generous, consistent vertical rhythm.** Paragraph spacing set by the block, not by
  stacked margins.
- **Lists** with proper markers and hanging indents; nested lists step in.
- **Quotes** with a left rule and muted text.
- **Code** in `IBM Plex Mono` or the repo's mono stack, on a subtle surface, block code
  scrolling inside its own `overflow-x: auto` container.
- **Tables** with a header rule, zebra-free, scrolling horizontally on their own rather
  than pushing the page sideways.
- **Links** visibly links — note that `globals.scss` sets `a { color: inherit;
  text-decoration: none; }` globally, so the document layer has to opt back in
  explicitly. This is a real gotcha, not a hypothetical.
- **Images** at measure width, centred, with an optional caption below in muted small type.

**Math in the reading view:**

- **Inline math** sits on the text baseline at the surrounding size, with no chip, no
  background and no border. In read mode an inline equation should be indistinguishable
  from the sentence it lives in — it is part of the prose, not an embed.
- **Block math** is centred on its own line with clear space above and below (more than a
  paragraph gap, less than a heading gap), and scrolls horizontally on its own if a long
  expression exceeds the measure — a wide matrix must never widen the page.
- **Equation numbers**, where the `label` attribute is set, sit flush right on the same
  baseline as the equation, in muted type.
- **Long division, matrices and arrays** keep their own `overflow-x: auto` container.

**And what the reading view must not have:** no hover gutters, no drag handles, no
placeholder text, no focus rings on content, no editable affordances of any kind. The
distinction between the two surfaces is entirely the chrome layer — §5.12.

### 5.12 One stylesheet, two consumers

**This is the architectural rule that makes §5.11 true, and it is easy to get wrong by
building the editor and the viewer separately.**

A single document stylesheet — call it `.doc` — lives in `packages/ui` and is applied to
exactly two things:

1. The ProseMirror content area inside `RichTextEditor`.
2. The output of `RichTextView`.

Every typographic decision in §5.11 is defined once, in that layer, against the existing
shadcn tokens. The editor then adds **only** interaction chrome on top: gutter controls,
selection outlines, placeholders, drop indicators, the math field's editing state. Remove
the chrome and the editor is the reading view, pixel for pixel.

Two payoffs. The obvious one is that WYSIWYG is structurally guaranteed rather than
maintained by hand — there is no second stylesheet to drift. The subtler one is that
`@repo/ui/content` stays genuinely light: the document styles ship with the *content*
entry point, and the editor imports them, never the reverse. A student downloads the
typography and KaTeX; they never download the chrome.

Amend the §6.1 tree accordingly:

```
packages/ui/src/
  content/
    document.css            ← the .doc layer. Owned here, imported by the editor.
    RichTextView.tsx
    Math.tsx
```

### 5.13 Why not `@tailwindcss/typography`

The `prose` classes are the obvious candidate for §5.11 and are the wrong choice **in
this repo specifically**, for two reasons that are both verifiable in the config:

1. **`important: true`** is set in every app's `tailwind.config.js`, deliberately and with
   a comment explaining why. Every utility therefore emits `!important` — including every
   utility the typography plugin generates. Overriding one of them for equation spacing,
   or for the editor's chrome layer, would require an inline `style={{}}`, which is the
   one thing that still beats an `!important` utility. That is a bad place to end up for
   a stylesheet this central.
2. **It brings its own colour system** (`--tw-prose-body`, `--tw-prose-headings`,
   `prose-slate` and friends) which duplicates and fights the shadcn token set emitted by
   `packages/ui/src/themes/preset.ts`. You would be maintaining two palettes and
   reconciling them at every theme change — and the `add-a-theme` skill exists precisely
   to stop that happening.

The alternative is about forty hand-written rules on tokens the repo already has. That is
an afternoon, it is fully theme-aware for free, and it is the layer §5.12 wants to own
anyway.

### 5.14 Non-negotiables

1. The word "LaTeX" never appears in the default UI.
2. No modal is ever required to author or edit an equation.
3. Clicking an equation always edits that equation.
4. `Esc` always cancels; `Ctrl+Z` always undoes, in the field and in the document.
5. Nothing the author typed is ever silently lost — invalid input is preserved and
   flagged.

---

## 6. Architecture

### 6.1 Package layout

The hard rule: **the editor and the renderer are different entry points, and the student
apps import only the renderer.**

```
packages/ui/src/
  content/                  → NEW subpath "@repo/ui/content"  (read-only, light)
    document.css              the .doc typography layer of §5.11 — owned here
    RichTextView.tsx          renders a doc JSON to React — no ProseMirror
    Math.tsx                  KaTeX render of one LaTeX string, memoised
    nodes/                    one renderer per node type
    index.ts
  editor/                   → NEW subpath "@repo/ui/editor"   (authoring, heavy)
    RichTextEditor.tsx        Tiptap instance, imports ../content/document.css
    chrome/                   the Notion layer of §5.9 — and nothing but chrome
      BlockGutter.tsx           ⊕ insert and ⠿ drag handle, on hover
      SlashMenu.tsx             the / command list
      SelectionToolbar.tsx      the bubble menu
      BlockMenu.tsx             turn into / duplicate / delete
    extensions/
      inline-math.ts          Tiptap node + NodeView
      block-math.ts           Tiptap node + NodeView
      callout.ts  toggle.ts   the §5.10 additions
      markdown-rules.ts       the input rules of §5.9, incl. $…$ and $$
      paste-math.ts           MathML / $-delimited paste handling
    equation/
      EquationField.tsx       wraps the core MathField, adds palette + gallery
      palette.ts              the taxonomy of §5.3, data
      gallery.ts              the formula gallery of §5.4, data
    index.ts
  core/
    MathField/                → NEW core wrapper over <math-field>, per
                                the create-core-component skill
```

`@repo/ui/content` depends on `katex` only. `@repo/ui/editor` depends on Tiptap and
MathLive and is **always reached through `next/dynamic` with `ssr: false`** from the
apps. `apps/learning` imports `@repo/ui/content` and nothing else; a student never
downloads an editor.

Both subpaths must be added to `packages/ui/package.json` `exports` and to each app's
Tailwind `content` globs — see the `extend-a-package` skill.

Per the layering rules in CLAUDE.md: the raw `<math-field>` element is wrapped once in
`packages/ui/src/core/MathField/`, and feature code never touches it directly.

### 6.2 The document model

Tiptap 3 (`@tiptap/react` 3.31.3, MIT, peers React ^19 — confirmed compatible with the
pinned React 19.2.8). ProseMirror JSON is the canonical document.

Node set for V1 — deliberately small, because every node is a node the Markdown
converter, the renderer, the translator and the migration all have to handle:

`doc` · `paragraph` · `heading` (levels 1–3) · `text` with marks
(`bold`, `italic`, `underline`, `strike`, `code`, `link`, `subscript`, `superscript`) ·
`bulletList` / `orderedList` / `listItem` · `taskList` / `taskItem` ·
`table` / `tableRow` / `tableCell` · `image` · `codeBlock` · `blockquote` ·
`callout` · `toggle` · `horizontalRule` · **`inlineMath`** · **`blockMath`**.

`callout`, `toggle` and `taskList` are the Notion-model additions justified in §5.10.
`toggle` is the one with real product leverage here: a worked solution or a hint
collapsed inside study material, which today requires a separate `Solution` entity or
nothing at all.

The two math nodes, which are the point of the exercise:

```ts
// inline — lives inside a paragraph, alongside text
{
  type: 'inlineMath',
  attrs: {
    latex: 'x^2 + 5x + 6 = 0',
    // Optional. Present only when the equation contains \text{...} spans that a
    // translator may need to localise; see §9.4.
    textSpans: null,
  },
}

// block — a top-level sibling of paragraph, rendered centred on its own line
{
  type: 'blockMath',
  attrs: {
    latex: '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    label: null,       // optional equation number / reference, e.g. "(3.1)"
    textSpans: null,
  },
}
```

Both are `atom: true`, `selectable: true`, `draggable: true`, with
`inlineMath` in the `inline` group and `blockMath` in the `block` group. `atom: true` is
what makes §5.6 work: the node is indivisible, so a backspace at its edge deletes the
whole equation or nothing, never half of it.

Deliberately **not** in V1, and listed so the omission is a decision rather than an
oversight: nested tables, footnotes, mentions, collaborative cursors, comments,
task lists. Tiptap's Comments/AI/Collaboration-server extensions are commercial; V1 uses
only MIT extensions and takes no Tiptap Pro dependency.

### 6.3 Why not Markdown as canonical (recorded, so it is not relitigated)

1. `$` collides with currency. `The pen costs $3 and the book $5` is a valid equation to
   any `$`-delimited parser. Fixing it means teaching authors to escape `\$`.
2. An equation in Markdown is a text range, so every keystroke requires re-parsing to
   know where equations are, and a backspace at a boundary silently corrupts one.
3. Attributes have nowhere to live. `label`, `textSpans`, and anything added later have
   no home in `$$...$$`.
4. Tables containing equations, images with captions, and anything beyond CommonMark +
   GFM have no canonical Markdown spelling — you invent a dialect, and then you own a
   parser.
5. Real-time collaboration, versioning and diffing later all need a document model. A
   string gives you line diffs of serialized math.

Markdown remains valuable, as **import and export** — §7.

### 6.4 Chemistry

The repo already has `ChemicalEquation.tsx` and `ChemicalEquationDoubleDirection.tsx`
(317 lines between them) building reaction arrows out of HTML tables. Both KaTeX and
MathLive support **mhchem**, which does this properly:

```
\ce{2H2 + O2 -> 2H2O}
\ce{CaCO3 ->[\Delta] CaO + CO2 ^}
\ce{N2 + 3H2 <=> 2NH3}
```

Enable it by importing `katex/contrib/mhchem` before first render, and expose it as the
`Chemistry` palette group with templates for single arrow, double arrow, reversible,
state symbols, charges and isotopes. The 317 lines go away.

### 6.5 Rendering: KaTeX, and what the switch costs

KaTeX 0.18.7 (MIT) replaces `better-react-mathjax`, which is in both `apps/learning` and
`apps/teaching` today. KaTeX is synchronous (MathJax's React binding typesets in an
effect after paint, which is why equation-heavy pages visibly reflow), it is roughly an
order of magnitude faster, it server-renders deterministically, and it emits MathML for
screen readers alongside its HTML.

The honest cost: **KaTeX's parser is stricter than MathJax's.** MathJax forgives things
KaTeX rejects, and there is existing content in the database written against MathJax. In
particular I would check `serializeTable()` in `util.tsx:37-43`, which emits
`\begin{array}{|c|c |}` — note the space before the closing brace in the column
specification. MathJax tolerates it; KaTeX's array column parser is stricter. **Phase 0
must extract every distinct LaTeX string in the database and render it through KaTeX,
producing a list of failures before anything else is committed to.**

Fixed render configuration, everywhere:

```ts
katex.renderToString(latex, {
  displayMode,           // false for inlineMath, true for blockMath
  throwOnError: false,   // an error becomes a visible chip (§5.7), never an exception
  errorColor: 'var(--destructive)',
  output: 'htmlAndMathml',  // MathML is what a screen reader reads
  trust: false,          // see §12 — blocks \href, \url, \includegraphics
  strict: 'ignore',
  maxSize: 50,           // bounds \rule abuse
  maxExpand: 1000,       // bounds macro-expansion blowup
});
```

### 6.6 Devanagari inside equations — a real problem

KaTeX ships its own fonts (`KaTeX_Main`, `KaTeX_Math`, `KaTeX_AMS`, …) covering Latin,
Greek and mathematical symbols. **They contain no Devanagari, Bengali, Tamil or Arabic
glyphs.** So `\text{क्षेत्रफल} = \pi r^2` renders the Hindi as tofu boxes — and the
architecture document's §8–§10 assume exactly this kind of mixed content works.

Two mitigations, both needed:

1. **Prefer keeping language text outside the equation.** `blockMath` gets an optional
   preceding paragraph; the palette should not encourage `\text{}` for prose.
2. When `\text{}` is unavoidable (unit labels, "Area", "where"), add an explicit CSS
   fallback on KaTeX's text spans:
   ```css
   .katex .mord.text,
   .katex .text { font-family: KaTeX_Main, 'Noto Sans Devanagari', 'Noto Sans', sans-serif; }
   ```
   and load the Noto subsets the supported languages need. The architecture document's
   §9 gets the font strategy right for body text; it has to extend inside KaTeX too.

Verify this by hand in Phase 0, in both light and dark theme.

### 6.7 Accessibility

Moved out of "future" (§3.2(h)) and into V1, because with these tools it is configuration:

- KaTeX's `output: 'htmlAndMathml'` already emits a MathML tree for assistive tech — the
  visual HTML is `aria-hidden`, the MathML is what gets read.
- MathLive speaks expressions and supports keyboard-only navigation of nested structure.
- Each equation node carries an optional author-supplied `alt` description, surfaced in
  the bubble toolbar, for the cases where the generated reading is poor.
- The editor must be fully keyboard-operable: toolbar reachable by Tab, every palette
  item reachable without a pointer.

### 6.8 Render performance

A 60-question test paper with three equations each is 180 KaTeX renders on one page.

- `Math.tsx` memoises on `(latex, displayMode)` — the same expression appearing in a
  question and its solution renders once.
- A module-level `Map` cache of `latex → html` string, bounded, shared across component
  instances.
- For the student read path, consider caching rendered HTML **server-side** alongside the
  document (a `renderedHtml` field, invalidated on save). Measure first; do not build
  this speculatively.
- Long papers should virtualise — `react-virtuoso` is already a dependency in all three
  apps.

### 6.9 Print and PDF

Test papers get printed, and this is the failure mode nobody notices until a teacher
prints 40 copies. KaTeX's HTML+CSS prints correctly in Chrome and Safari provided the
KaTeX fonts are actually loaded (not merely referenced) and `print` styles do not
override font sizes. **Add a print check to Phase 0's validation**, including page-break
behaviour across a display equation.

### 6.10 Browser support

"Every browser" has to be turned into a matrix before it is implementable, and the useful
news is that **the split in §6.1 is also a browser-support strategy, not only a bundle-size
one.** The two surfaces have very different floors:

- **The reading view is HTML, CSS and KaTeX.** No custom elements, no shadow DOM, no
  `contenteditable`, no ProseMirror. It is, structurally, a styled document. Its support
  floor is essentially "a browser with CSS" — which includes the cheap Android handsets
  and old WebViews a large share of students will be on.
- **The editor needs a modern browser,** because MathLive is a custom element and Tiptap
  is `contenteditable`. That is acceptable: authors are teachers and staff on managed
  machines and tablets, a far narrower and more controllable population than students.

So the honest statement of the requirement is: **students get near-universal support;
authors get modern browsers.** Designing for one number across both would either cripple
the editor or exclude students, and the architecture already separates them.

**Proposed matrix**, to be confirmed against your actual analytics:

| Surface | Support target |
| --- | --- |
| Reading (`apps/learning`) | Chrome / Edge / Firefox / Safari, last 4 years; Android WebView 90+; iOS Safari 14+ |
| Authoring (`apps/teaching`, `apps/support`) | Last 2 versions of Chrome, Edge, Firefox, Safari on desktop; iPadOS Safari 16+; Chrome Android 100+ |
| Explicitly not supported | IE11; Opera Mini in extreme data-saving mode (it proxies and strips JS, so no rich editor can work); any browser without custom-element support, for the editor only |

**Make it explicit rather than implicit.** There is no `browserslist` key anywhere in the
repo, so all three apps currently inherit Next 16's defaults — which already exclude a
good deal of what "every browser" might be taken to mean. Nobody has decided that; it was
inherited. Add an explicit `browserslist` to each app's `package.json` so the target is a
choice on the record, and so a future dependency upgrade cannot quietly move it.

**Server-render the math.** KaTeX's `renderToString` runs on the server, so equations can
be in the HTML before any JavaScript executes. On a slow device, a flaky connection, or a
browser where the bundle fails outright, the student still sees a correctly typeset
question. This is a substantial robustness win and it is only available because KaTeX is
synchronous — it is another argument against the current `better-react-mathjax`, which
typesets client-side in an effect and cannot do this.

**The four real risks, in the order I would test them:**

1. **Devanagari and other Indic input into `contenteditable`.** The highest-risk item for
   *this product specifically*. Transliteration IMEs — Google Input Tools, Gboard's Hindi
   transliteration, InScript layouts — drive composition events that browsers handle
   inconsistently inside `contenteditable`, and Safari is the usual offender. ProseMirror
   handles composition better than anything hand-rolled, but "better" is not "verified".
   **Test with a real IME, on a real device, in Phase 0** — not by pasting Hindi text,
   which exercises none of the same code.
2. **iOS Safari and the virtual keyboard.** MathLive must suppress the system keyboard
   and present its own, which is historically the flakiest part of any math field on iOS.
   Must be checked on physical hardware; the simulator does not reproduce keyboard
   behaviour faithfully.
3. **KaTeX font loading.** If the fonts fail to load, math does not error — it renders in
   a fallback face and is subtly, silently wrong, which is worse than a visible failure.
   Self-host the fonts, preload the three or four faces actually used, and add a load
   check.
4. **Android WebView versions.** If any of this is consumed inside a wrapper app, the
   WebView version is the browser, and it can lag the system Chrome badly.

**A pre-existing nit, since we are on the subject.** `globals.scss` sets
`html { overflow: overlay; }`, which is non-standard, was never supported in Firefox, and
is being removed from Chrome. It degrades to `auto` so nothing breaks, and the
`scrollbar-width: none` and `::-webkit-scrollbar` rules beside it already do the real
work — but it is dead weight in a file that three apps load.

Add the matrix to Phase 0's validation (§14) and to the manual pass in §13. A
cross-browser service such as BrowserStack covers the breadth; items 1 and 2 above need
real hardware regardless.

---

## 7. Markdown, and the AI authoring path

These are one subsystem, not two, and that is the main thing this section exists to say.

**AI-generated content is written in Markdown, not in ProseMirror JSON.** So the importer
specified here is not a convenience feature for the occasional `.md` upload — it is the
write path for every question, study material and worksheet a model produces. That
raises both its priority (it moves from Phase 4 to Phase 3, §14) and its quality bar.

### 7.1 Why the AI writes Markdown

Asking a model to emit ProseMirror JSON directly is the obvious idea and the wrong one:

- **It gets the schema wrong.** Nested `content` arrays, `marks` arrays, exact node names
  and per-node `attrs` are a lot of structure to hold, and a single misplaced bracket
  invalidates the whole document. Markdown has no invalid states worth speaking of.
- **It costs four to six times the tokens** for the same paragraph. Generating a
  200-question paper, that is the difference between a cheap batch job and an expensive
  one, in latency as well as price.
- **Markdown with `$…$` math is the single best-represented authoring format in any
  model's training data.** LaTeX inside Markdown is how essentially all of arXiv,
  Jupyter, StackExchange and every textbook repository is written. You are asking for the
  thing the model is already best at.

The same argument applies in reverse for revision: to have a model improve an existing
question, hand it Markdown, not a JSON tree.

### 7.2 The contract, corrected

I said in an earlier draft that export is best-effort and there is no round-trip
guarantee. **That was right for a human import and wrong once AI is a first-class
author,** because AI revision is `doc → Markdown → model → Markdown → doc` and every lap
of that loop must not degrade the document.

The guarantee is therefore narrower but real:

- **The AI-safe subset round-trips losslessly.** `doc → Markdown → doc` is the identity
  function over that subset, asserted by test (§13).
- **Everything outside the subset exports best-effort** and may lose fidelity.
- **Import is still a one-time ingest.** Markdown becomes a document and the document is
  canonical from then on. Nothing in the product ever shows a user a Markdown view they
  can edit and save back.

That inverts how the subset gets chosen, usefully: **the AI-safe subset is defined as the
set of nodes that round-trip exactly.** It is a test result, not a committee decision.

### 7.3 The subset, and its exact Markdown spelling

Written down once so it is not rediscovered per-node. Every row here round-trips:

| Node | Markdown | Round-trips |
| --- | --- | --- |
| `heading` 1–3 | `#`, `##`, `###` | exact |
| `paragraph`, `bold`, `italic`, `code`, `strike`, `link` | CommonMark | exact |
| `bulletList`, `orderedList` | `-`, `1.` | exact |
| `taskList` | GFM `- [ ]` / `- [x]` | exact |
| `blockquote` | `>` | exact |
| `codeBlock` | fenced, with language | exact |
| `table` | GFM pipe table | exact |
| `horizontalRule` | `---` | exact |
| `image` | `![alt](url)` | exact |
| **`inlineMath`** | `$ … $` | exact |
| **`blockMath`** | `$$ … $$` | exact |
| **`callout`** | GitHub alert — `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` | exact |
| **`toggle`** | `<details><summary>…</summary>…</details>` | exact |

The last two are worth the attention. Both are heavily represented in training data —
GitHub alerts and `<details>` are how every README writes these — so **a model can emit
them unprompted and correctly**, and both have a precise parse. That is what turns the
two Notion-flavoured blocks of §5.10 from an export liability into AI-writable structure.
`toggle` in particular is how a model produces study material with the worked solution
collapsed underneath the exercise, which is exactly the shape this product wants.

Outside the subset and therefore best-effort on export: equation `label` numbers, image
captions, table cell alignment beyond GFM.

Math mapping detail: on export, escape any bare `$` in text so a re-import does not invent
an equation.

### 7.4 The envelope: structure at the top, Markdown inside

Free-form prose is not enough for a question — a question is a typed object. So the shape
an AI is asked for is **a small JSON envelope whose content fields are Markdown strings**.
Structure where structure is load-bearing, Markdown where prose is:

```jsonc
{
  "type": "SINGLE_CHOICE",
  "question": "Solve for $x$:\n\n$$x^2 + 5x + 6 = 0$$",
  "options": [
    { "text": "$x = -2$ or $x = -3$", "isCorrect": true },
    { "text": "$x = 2$ or $x = 3$",   "isCorrect": false },
    { "text": "$x = -1$ or $x = -6$", "isCorrect": false },
    { "text": "$x = 1$ or $x = 6$",   "isCorrect": false }
  ],
  "solution": "Factorise:\n\n$$x^2 + 5x + 6 = (x + 2)(x + 3)$$\n\nSo $x = -2$ or $x = -3$.",
  "level": "MEDIUM",
  "marks": 4
}
```

This maps one-to-one onto the `Question` / `Option` / `Solution` entities that already
exist, and — importantly — onto the validation the repo already does. The envelope is a
`class-validator` DTO in `packages/shared/src/dtos/validations/question/`, exactly like
`AttachmentDto`, and the global `ValidationPipe` runs with `forbidNonWhitelisted`, so a
model that invents a field gets a 400 rather than silently writing it. **No new
validation machinery is needed for AI input; it goes through the same door as a form
post.**

A registry of content types, each an envelope DTO plus the subset it may use:
`QUESTION` · `STUDY_MATERIAL` · `SOLUTION` · `WORKSHEET` · `LESSON_PLAN`. Adding a type is
adding a DTO, which is a pattern the repo already has twenty of.

### 7.5 One write path, two accepted shapes

The editor holds a `doc`. An AI holds Markdown. Rather than two endpoints that drift,
the content field on a write is a discriminated union, normalised to `doc` before it is
stored:

```ts
type ContentInput =
  | { format: 'markdown'; value: string }
  | { format: 'doc'; value: object };
```

The server parses Markdown to `doc`, then validates the `doc` against the ProseMirror
schema exactly as it would for an editor write (§10.1). One validation point, one stored
representation, and AI content and human content converge before anything is persisted.

**Do not cache a Markdown copy alongside the document.** Serialise on demand when a model
needs to read. `IRichText` already carries a denormalised `text` projection (§8.1); a
third representation is a third thing to keep in sync, and the serializer is fast.

### 7.6 Validating what the model produced

AI output is untrusted input that happens to come from your own backend. Three gates,
all of which reuse machinery this plan already requires:

1. **Envelope validation** — the DTO above. Free.
2. **Schema validation** — parse to `doc`, reject node types outside the subset. This is
   §10.1, already required for editor writes.
3. **Every equation renders.** Run each `latex` attribute through KaTeX before storing.
   This is the *same* corpus-check script written for Phase 0 (§6.5, §11.1), pointed at
   new content instead of old. A question whose equation does not render is worse than no
   question, because it reaches a student looking authoritative.

On a failure at gate 3, hand the KaTeX error back to the model and retry once. A two-pass
generate-and-repair loop costs one extra call and removes nearly all of this class of
failure.

**LaTeX hazards specific to language models**, which the normalisation pass should handle
rather than rejecting:

- **Delimiter variants.** Models emit `\(…\)` and `\[…\]` as readily as `$…$`. Accept all
  three on input; emit only `$`/`$$`.
- **Double-escaping through JSON.** `\frac` versus `\\frac` depends on how the model was
  prompted and how the response was parsed. Normalise once, centrally, rather than at
  each call site.
- **Environments KaTeX does not support.** `\begin{equation}`, `\label{}`, `\usepackage`
  and `align` with numbering are common model output and will fail gate 3. Rewrite
  `equation` → plain display math and `align` → `aligned` where possible; reject the rest
  with a message the repair pass can act on.

### 7.7 Implementation

`remark-parse` + `remark-gfm` + `remark-math` (6.0.0, MIT) → mdast → an explicit
mdast-to-ProseMirror mapper, plus a hand-written ProseMirror-to-Markdown serializer.
`tiptap-markdown` (0.9.0) exists and is worth evaluating in Phase 0, but an explicit
mapper is roughly 300 testable lines and gives full control over the math nodes and the
two custom blocks — which is the part that matters, and the part a generic converter will
get wrong.

Note the convergence with §9.4: AI translation and AI authoring want the same discipline —
**give the model text, never structure.** Translation hands it `\text{}` spans; authoring
hands it Markdown. In neither case does a model see or emit a ProseMirror tree.

---

## 8. Data contracts and storage

### 8.1 The shape

One new shape in `packages/shared`, reused by every entity that holds authored content —
this is the alternative to the architecture document's parallel CMS (§3.2(c)). Per the
`define-data-shape` skill it belongs in `packages/shared/src/interfaces/`:

```ts
// packages/shared/src/interfaces/rich-text.interface.ts

/** Bumped only when a document migration is required; readers branch on it. */
export type RichTextFormat = 'doc/v1';

export interface IRichText {
  format: RichTextFormat;
  /** ProseMirror/Tiptap document JSON. Canonical. */
  doc: unknown;
  /**
   * Plain-text projection of `doc`, equations reduced to their LaTeX. Denormalised on
   * every write. This is what search, sort, list previews and CSV export read — never
   * walk `doc` for those.
   */
  text: string;
}
```

`doc` is typed `unknown` rather than a hand-written ProseMirror type union deliberately:
the shape is owned by the ProseMirror schema, and duplicating it in `@repo/shared` would
create a second definition that drifts. Validation happens at one boundary — a
`Schema.nodeFromJSON()` check on the server (§10) — and consumers go through the renderer,
never through raw traversal.

### 8.2 Where it lands

| Collection | Field today | After |
| --- | --- | --- |
| `Question` | `question: string` | `question: IRichText` |
| `Option` | `option: string` | `option: IRichText` |
| `Solution` | `solution: string` | `solution: IRichText` |
| `Material` | `content: string` | `content: IRichText` |

`Question.text` already exists as a plain-text field and becomes the natural home of
`question.text` — that instinct in the current schema was right.

Stored as a Mongoose subdocument with `_id: false`, mirroring `MarkingSchema` in
`question.schema.ts`. Follow `add-server-module` and `query-with-mongoose` for the schema
work.

### 8.3 Indexing

MongoDB cannot usefully index a nested arbitrary document. Search and sort read
`<field>.text`. Add a text index there if full-text question search is a requirement:

```ts
QuestionSchema.index({ 'question.text': 'text' });
```

### 8.4 Why not a more compact encoding

`doc` is a **native subdocument**, not a string holding some denser notation. The question comes
up because the editor's output panel shows the same document as TOON — Token-Oriented Object
Notation, a format built to cut tokens in an LLM prompt — and it looks 43% smaller than the JSON
beside it. That number does not survive contact with the database, and the reasoning is worth
recording so the decision is not reopened on the strength of it.

Measured on the four real sample documents, bytes per question:

| Stored as | In BSON | After block compression | 100k questions |
| --- | --- | --- | --- |
| **native BSON subdocument** | 1766 | **656** | 66 MB |
| compact JSON string | 1523 | 465 | 47 MB |
| TOON string | 1805 | 487 | 49 MB |
| gzip(compact JSON) as `Binary` | 480 | 480 | 48 MB |
| gzip(TOON) as `Binary` | 502 | 502 | 50 MB |
| brotli(TOON) as `Binary` | 463 | 463 | 46 MB |

Three things follow.

**The 43% was against pretty-printed JSON, which nothing stores.** MongoDB stores BSON, and BSON
is already more compact than indented text. Uncompressed, TOON-in-BSON is *larger* than the native
subdocument on the most typical document (3136 vs 2670 bytes).

**TOON is not even the smallest option.** Once the storage engine compresses, plain compact JSON
(465) beats TOON (487) and beats gzip(TOON) (502). That is not a fluke but the mechanism: TOON
saves bytes by not repeating `type`, `attrs` and `content` on every node, and WiredTiger's block
compressor removes exactly that repetition already, across the whole block. Encoding to TOON first
is collecting the same saving twice, and the second collection costs a decode.

**The whole spread is 20 MB per 100,000 questions.** That is not a storage problem, and it is the
entire prize for giving up querying, indexing, partial updates, readability in Compass, and a read
path measured at 17× slower — 0.0174 ms/doc for BSON against 0.2987 ms for a TOON decode, which is
1 ms against 18 ms for a sixty-question paper.

One earlier objection did **not** hold and should not be repeated: TOON round-trips losslessly.
`decode(encode(doc))` is byte-identical on every sample document, multilingual and chemistry
included. It was rejected on cost, not on fidelity.

**If storage size ever does matter, change the compressor, not the format:**

```ts
db.createCollection('questions', {
  storageEngine: { wiredTiger: { configString: 'block_compressor=zstd' } },
});
```

zstd typically beats snappy by 20–40% on data of this shape, applies to every field in the
collection rather than one, and costs nothing structurally.

TOON keeps one legitimate use, at the other boundary: handing structure to a model, where tokens
are the currency. Even there §7.1 prefers Markdown. The output panel's TOON tab is a measuring
instrument, not a storage candidate.

*(The compression column uses gzip as a stand-in for snappy, which is weaker — so the
uncompressed rows would fare slightly worse in reality. It widens the gap a little and changes
nothing, because the gap is 20 MB.)*

---

## 9. Multilingual and translation

Keeping the architecture document's model (§11–§20) with the four corrections below.

### 9.1 Shape

Rather than a new `contents` document type, translations attach to the entities that
already exist:

```ts
@Schema({ timestamps: true })
export class ContentTranslation extends BaseSchema {   // brings org, _deleted, audit
  @Prop({ type: String, enum: TranslatableEntity, required: true })
  entity: TranslatableEntity;          // QUESTION | OPTION | SOLUTION | MATERIAL

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  entityId: string;

  @Prop({ type: String, required: true })
  language: string;                    // BCP-47: 'en', 'hi', 'sa', 'ar'

  @Prop({ type: RichTextSchemaDefinition, required: true })
  content: RichText;

  @Prop({ type: String, enum: TranslationStatus, required: true })
  status: TranslationStatus;

  /** Monotonic, per translation document. Bumped on every content-changing save. */
  @Prop({ type: Number, required: true, default: 1 })
  version: number;

  @Prop({ type: String, required: true })
  sourceLanguage: string;

  /** The `version` of the SOURCE-language translation row this was made from. */
  @Prop({ type: Number, required: true })
  sourceVersion: number;

  @Prop({ type: String, enum: TranslationMethod, required: true })
  translationMethod: TranslationMethod;   // MANUAL | AI | IMPORTED

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reviewedBy: string;
}
```

The default-language row is a translation row like any other, with
`language === sourceLanguage` and `sourceVersion === version`. That removes the special
case where the source lives in one place and translations in another — which is the bug
in §9.2.

### 9.2 The versioning correction

The architecture document (§17) puts `translationVersion` on the language-agnostic
`contents` document. That breaks as soon as any non-source language is edited: editing
the Hindi translation bumps the shared counter, and now *English* looks stale against it.

**Version must be per-translation-document.** Staleness is then a straightforward
comparison, with no shared mutable counter:

```
hindi.sourceVersion  <  english.version   →  Hindi is stale, needs review
hindi.sourceVersion === english.version   →  Hindi is up to date
```

### 9.3 The index correction

Everything here soft-deletes, so a plain unique index rejects a legitimate re-create:

```ts
ContentTranslationSchema.index(
  { entity: 1, entityId: 1, language: 1 },
  { unique: true, partialFilterExpression: { _deleted: false } },
);
ContentTranslationSchema.index({ org: 1, entity: 1, entityId: 1, _deleted: 1 });
```

### 9.4 "Equations don't need translation" — mostly true, not entirely

The architecture document's §10 and §26 are right that LaTeX *structure* must never be
touched by a translator or an AI. But four things inside an equation are language-bound:

1. **`\text{...}` and `\mathrm{...}` spans.** `\text{Area} = \pi r^2` has to become
   `\text{क्षेत्रफल} = \pi r^2`. These are the `textSpans` attribute on the math nodes
   (§6.2): extracted for translation, substituted back into the LaTeX, structure
   untouched.
2. **Unit abbreviations**, where the convention differs by locale.
3. **Decimal and thousands separators** — `3.14` vs `3,14`.
4. **Numerals.** Arabic content may use Eastern Arabic numerals (٣٫١٤).

So the rule is sharper than "do not translate equations": **translate `\text{}` spans;
never touch anything else.** The AI translation flow (document §25) should be handed a
node-by-node extraction where each math node contributes only its `textSpans`, and the
LaTeX itself is never in the model's output at all. That is also the cheapest defence
against an LLM "helpfully" rewriting a formula.

### 9.5 RTL

Arabic and Hebrew need `dir="rtl"` on the content container, mirrored editor chrome, and
— importantly — **equations stay LTR inside RTL text**. KaTeX handles the equation
itself; the surrounding inline flow needs the right Unicode bidi isolation
(`<span dir="ltr">` around the rendered equation, or `unicode-bidi: isolate`). Verify
with a real Arabic question containing an inline equation.

### 9.6 Language configuration

Keep the architecture document's `LanguageConfig` (§20) as written — `code`, `name`,
`nativeName`, `direction` — in `packages/shared`, since both the server (validation) and
all three apps (selectors) need it. Start with `en`, `hi`, `sa` per §33.

---

## 10. Server API

Following `.claude/plans/API_CONVENTIONS.md` and the `add-api-endpoint` skill. Roughly
the architecture document's §21, re-cast onto the entity model:

```
GET    /questions/:id?language=hi              → the question in hi, falling back to source
GET    /questions/:id/translations             → [{ language, status, version, isStale }]
POST   /questions/:id/translations             → { language, content } — create
PATCH  /questions/:id/translations/:language   → update
POST   /questions/:id/translations/:language/publish
POST   /questions/:id/translations/:language/translate   → AI-assisted draft (later phase)
```

Two server-side rules that matter:

1. **Validate the document on write.** The server holds the ProseMirror schema (it is
   plain JSON — a small shared schema description, not the editor) and rejects a `doc`
   that does not parse, or that contains node types outside the allowed set. Without
   this, the content field is an arbitrary-JSON hole in an otherwise validated API.
2. **Fall back on read.** `?language=hi` with no Hindi translation returns the source
   language plus a flag, never a 404. A student must never see an empty question because
   a translation is missing.

---

## 11. Migration — the part that will take the longest

There is existing content, in two formats, and it must survive.

### 11.1 What is actually in the database

`getBlocks()` (`util.tsx:384`) tells the story:

```ts
const isBlocks = html.startsWith('[');
const blocks = isBlocks ? JSON.parse(html) : [{ type: TEXT, content: html }];
```

So each row is **either** a JSON-serialized `Block[]` **or** a bare HTML string from an
even earlier iteration. Both need converting, and the HTML one needs sanitising (§12).

**Step zero, before writing any converter: run an inventory script.** Count rows of each
shape per collection, extract every distinct LaTeX string, and render each through KaTeX
(§6.5). The output of that script determines the real size of this phase, and it is
cheap to write.

### 11.2 The converter

`Block[] → Tiptap JSON`, run offline, in `apps/server` as a one-off script (there is no
migration tool in this repo, per `query-with-mongoose`):

| Old | New |
| --- | --- |
| `TextNode` (HTML string) | sanitise → parse → `text` nodes with marks |
| `EquationNode` | `serializeEquation()` on each block → one `blockMath` / `inlineMath` |
| `HeadingNode` | `heading` at the mapped level |
| `ListNode` / `OrderedListNode` | `bulletList` / `orderedList` |
| `ImageNode` (`data` base64 or `url`) | `image`; base64 payloads uploaded to S3 first (the `s3` module already exists) and replaced with a URL |
| `CodeNode` | `codeBlock` |
| `LinkNode` | `link` mark, or a link node for block links |
| `SymbolNode` | `inlineMath` if mathematical, otherwise a text character |

**This is why `serializeEquation()` must not be deleted first.** It is the only code that
understands the old equation AST, and it already produces correct LaTeX.

### 11.3 Sequencing (expand → migrate → contract)

1. **Expand.** Add the new `IRichText` field alongside the existing string field
   (`questionDoc` next to `question`). Nothing reads it.
2. **Dual-write.** The editor writes both: new format to the new field, and
   `.text` to the legacy string field so anything still reading it keeps working.
3. **Backfill.** Run the converter over history, in batches, idempotently, recording
   per-row failures rather than aborting. Failures get a manual queue — with real
   content there will be some.
4. **Verify.** Render both formats for a sample and compare (§13). Do not skip this.
5. **Flip reads.** Point `apps/learning` and `apps/teaching` at the new field behind a
   flag; roll it out per organisation.
6. **Contract.** Drop the legacy field, delete both copies of the old editor, remove
   `better-react-mathjax` and `react-contenteditable` from all three apps.

The old editor stays on disk and functional until step 6. Rolling back after step 5 must
be a config change, not a redeploy.

---

## 12. Security

**12.1 The existing stored-XSS hole is the priority item in this document.**
`util.tsx`'s `renderTextBlock` passes author-controlled `innerHTML`
— harvested from a `contentEditable` at `TextEditor.tsx:55` and stored verbatim — to
`dangerouslySetInnerHTML`, and `apps/learning/src/components/others/Html.tsx` renders it
to students. Anything that can write a question can execute script in every reader's
session, against their Firebase session.

This does not need to wait for the editor rewrite. **Sanitise on the read path now** (a
strict allowlist over the rendered HTML), then sanitise again during the backfill
(§11.2), and the new architecture removes the class of bug permanently — `RichTextView`
renders typed nodes into React elements and never interprets a string as markup.

**12.2 KaTeX.** Keep `trust: false` (the default), which disables `\href`, `\url` and
`\includegraphics`. Never enable it for author-supplied input. Keep `maxExpand` and
`maxSize` bounded (§6.5) so a macro-expansion bomb cannot lock a student's tab.

**12.3 Server-side document validation.** §10.1. Without it, `content` is an
unvalidated JSON blob on an otherwise validated API.

**12.4 Images.** Base64 payloads in the document (which the current `ImageNode` allows)
must become S3 URLs; inline base64 makes documents enormous and dodges the upload path's
type and size checks.

**12.5 Markdown import** is untrusted input. Run the same sanitisation and schema
validation as any other write; do not trust a `.md` file because a staff member uploaded
it.

---

## 13. Testing

The repo has no tests at all today. A format-conversion project cannot be done safely
that way, and the minimum is small. Add Vitest to `packages/ui` and `apps/server` and
cover exactly four things:

1. **LaTeX corpus.** Every distinct expression pulled from the database (§11.1) as
   fixtures, asserted to render through KaTeX without error. This is the regression net
   for the MathJax → KaTeX switch, and it is generated, not written.
2. **Markdown round-trip.** Two distinct assertions, per §7.2. Over the **AI-safe
   subset**, `doc → md → doc` must be the identity — this test is what *defines* the
   subset, so a node that fails it leaves the subset rather than the test being relaxed.
   Outside the subset, assert the *known* lossy cases explicitly, so loss is a recorded
   decision and not a surprise.
3. **Migration converter.** Real `Block[]` samples of every node type → expected Tiptap
   JSON. Include the bare-HTML legacy rows and the sanitiser.
4. **Translation staleness.** The `sourceVersion`/`version` comparison of §9.2, including
   the case that broke the original design (editing a non-source translation must not
   make the source look stale).

5. **AI output gates.** Fixture envelopes containing the failure modes of §7.6 —
   `\(…\)` delimiters, double-escaped `\\frac`, `\begin{equation}`, an unrenderable
   expression — asserted to be normalised or rejected, never stored.

Manual verification, per the `verify-changes` skill, on every phase: author a question
with nested math, save, reload, click the equation, edit it, save again; render it in
`apps/learning`; print it; do all of that in Hindi, typed with a real IME, in dark mode,
and across the §6.10 matrix.

---

## 14. Delivery order

All three workstreams are in scope. The order below is chosen so each phase leaves the
product working and independently better, and so the riskiest unknowns are resolved
before anything is committed to.

**Phase 0 — Validate (short, no product change).**
Spike MathLive in `apps/teaching/src/pages/math.tsx`, which already exists as a scratch
page. Answer, with a running page: does the web component behave under React 19 and
Next 16's Pages Router? Does the virtual keyboard work on a tablet — on real hardware,
not the simulator (§6.10)? **Can a teacher type Hindi into it with a transliteration
IME** (§6.10, risk 1)? Does Devanagari render inside `\text{}` (§6.6)? Run the database
inventory and the KaTeX corpus check (§11.1, §6.5), check print output (§6.9), and walk
the browser matrix (§6.10). **Nothing proceeds until the corpus renders, the Devanagari
question is answered, and Indic input is confirmed working.**

**Phase 1 — The equation field, and the reading view.**
`packages/ui/src/core/MathField` + `EquationField` with the palette (§5.3), the formula
gallery (§5.4), the keyboard (§5.5) and the LaTeX disclosure (§5.8). Plus the whole
`@repo/ui/content` entry point: `Math.tsx` on KaTeX, `RichTextView`, and
**`document.css` — the `.doc` typography layer of §5.11**. No Tiptap yet.

The stylesheet comes first deliberately: §5.12 has the editor importing it from the
content entry point, so it has to exist before Phase 2 can be WYSIWYG at all. Building it
the other way round is how the two surfaces drift.

This phase is independently shippable twice over: the field can replace the
modal-per-function toolbar inside the *existing* editor — fixing §2.3, the loudest
complaint, before the rewrite lands — and the reading view can be reviewed against real
Markdown fixtures long before any content is migrated to it.

**Phase 2 — The document editor.**
Two halves, in order, both behind a flag alongside the old editor.

*2a — the document.* Tiptap 3, the node set of §6.2 including `callout`, `toggle` and
`taskList`, the two math nodes with NodeViews wrapping Phase 1's field, the Markdown
input rules of §5.9 (including `$…$` and `$$`, which are the cheapest win in the plan),
and paste handling (§5.6). `RichTextEditor` renders through `document.css`, so it looks
like the reading view from the first commit.

*2b — the chrome.* The Notion layer of §5.9: block gutter with `⊕` and `⠿`, drag to
reorder, the slash menu, the selection toolbar, the block menu, placeholders, keyboard
semantics. This is strictly additive — nothing in 2b changes what a block *is*, only how
it is manipulated — which is why it is separable and why it can be tuned after authors
have used 2a.

**Phase 3 — Storage, the Markdown parser, and migration.**
`IRichText` in `@repo/shared`; expand the four schemas; server-side schema validation;
the `ContentInput` discriminated union (§7.5); **the Markdown-to-`doc` parser**; the
`Block[]` converter and backfill (§11). Sanitise legacy HTML. Flip reads per
organisation.

The parser moves here from a later phase because §7 changed its role: it is not a
file-import convenience, it is the write path for AI-generated content, so it has to exist
the moment anything can be stored.

**Phase 4 — AI authoring, and Markdown export.**
The envelope DTOs and content-type registry (§7.4), the three validation gates and the
generate-and-repair loop (§7.6), the LaTeX normalisation pass, and the
`doc`-to-Markdown serializer with the round-trip tests that *define* the AI-safe subset
(§7.2, §7.3). Plus the file-import UI, which by this point is a thin wrapper over
machinery Phase 3 already built.

**Phase 5 — Multilingual.**
`ContentTranslation` collection (§9), the translation API (§10), the language selector
and translation panel (architecture document §23–§24, which are good as drawn),
staleness detection, and `\text{}`-span extraction (§9.4). AI-assisted translation last,
built on the extraction, never on raw LaTeX.

**Phase 6 — Contract.**
Delete both copies of the old editor, drop the legacy string fields, remove
`better-react-mathjax` and `react-contenteditable` from all three apps.

**12.1 is not in this sequence.** The XSS fix ships on its own, immediately, ahead of
everything.

---

## 15. Deferred, deliberately

Each of these is a real requirement someone will raise. Recording them as decisions:

- **Handwriting input** (write the equation with a finger/stylus). The most-requested
  feature in this category. Needs MathType or MyScript — commercial. `Draw.tsx` exists in
  the current editor, suggesting this was already attempted.
- **Photo → equation.** MathPix's API turns a photograph of a textbook page into LaTeX.
  Extremely high value for teachers digitising existing question banks; paid, per-request.
- **Graph and geometry figures.** Function plots, labelled triangles, number lines.
  Adjacent to equations but a different editor (Desmos/GeoGebra embeds, or a plot node).
- **Interactive/answerable math** — a student typing an answer into a math field, with
  equivalence checking (`x+x` equals `2x`). MathLive's field is the input; the
  equivalence check is a computer-algebra problem.
- **Real-time collaboration.** Y.js over ProseMirror. The document model chosen here
  makes it possible later; Tiptap's collaboration *server* is commercial, the client
  extension is not.
- **Version history and content branching.**
- **Sentence-level translation units and translation memory** (architecture document §19).
  Agreed with the document: not until there is a concrete need.

---

## 16. Dependencies

Checked against the repo's pins (React 19.2.8, Next 16.3.4, TypeScript 6.0.3) on
2026-09-15. Read `extend-a-package` before adding any of these, and add them to the
specific workspace with `pnpm add:teaching` / `add:learning` — never a bare root
`pnpm add`.

| Package | Version | Licence | Where |
| --- | --- | --- | --- |
| `mathlive` | 0.110.0 | MIT | `packages/ui` (editor entry only, lazy) |
| `katex` | 0.18.7 | MIT | `packages/ui` (content entry) |
| `@tiptap/react`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit` | 3.31.3 | MIT | `packages/ui` (editor entry) — peers accept React ^19 ✓ |
| `remark-parse`, `remark-gfm`, `remark-math` | 6.x | MIT | `apps/server` (import) |
| a sanitiser for the legacy HTML | — | — | `apps/server` (migration) |

**Removed at Phase 6:** `better-react-mathjax`, `react-contenteditable` — from
`apps/learning`, `apps/teaching` and `apps/support`.

Note for `packages/ui`: Tiptap and MathLive belong in `dependencies` there, but the
editor entry point must not be reachable from `@repo/ui` or `@repo/ui/content`, or every
app pulls them in regardless. Enforce it with a `no-restricted-imports` entry in
`packages/eslint-config`, the way the existing layering rules are enforced.

---

## 17. Open questions

1. **Does the formula gallery (§5.4) need to be editable by support staff, or is a
   hard-coded list acceptable for V1?** Affects whether it is seeded data in `apps/support`
   or a constant in `packages/ui`.
2. **Is there an existing question bank to import?** If teachers have Word or PDF question
   banks, MathPix (§15) moves from "deferred" to "Phase 1", because it changes the whole
   adoption story.
3. **Which languages are actually committed?** `en`/`hi`/`sa` per the architecture
   document — but Arabic appears in its examples, and Arabic brings RTL (§9.5), which is
   a meaningful amount of additional work. Worth settling before Phase 5.
4. **Is multi-organisation content sharing in scope** (architecture document §29,
   global vs org content)? It interacts with the org-scoping rules on every read and is
   easier to design in than to retrofit.
