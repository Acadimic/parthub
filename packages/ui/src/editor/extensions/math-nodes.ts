import { InputRule, mergeAttributes, Node, nodeInputRule, nodePasteRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { EMPTY_REACTION_LATEX } from '../equation/chemistry';
import { BLOCK_MATH_NAME, INLINE_MATH_NAME } from './math-names';
import { MathNodeView } from './MathNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    math: {
      /**
       * Inserts an inline equation at the caret. With no `latex` and a text selection, the
       * selected text becomes the equation — how an author promotes `x^2+1` they already typed.
       */
      insertInlineMath: (latex?: string) => ReturnType;
      /** Inserts a display equation on its own line. */
      insertBlockMath: (latex?: string) => ReturnType;
      /** Inserts a chemical equation seeded with one arrow, so it opens into the reaction form. */
      insertChemicalEquation: () => ReturnType;
      /** Replaces the LaTeX of the equation at `pos`. */
      setMathLatex: (pos: number, latex: string) => ReturnType;
      /** Converts the equation at `pos` between inline and display. */
      toggleMathDisplayMode: (pos: number) => ReturnType;
      /** Inserts a copy of the equation at `pos` immediately after it. */
      duplicateMath: (pos: number) => ReturnType;
    };
  }
}

/**
 * ProseMirror must not handle events that land inside an equation.
 *
 * Without this, its `selectClickedLeaf` runs on mouseup over the atom and applies a NodeSelection
 * computed *before* the click opened the editor; React has re-rendered the node view by then, so
 * the position no longer maps to the current document and ProseMirror throws on the very first
 * click of an equation. Drag events are let through so `draggable: true` keeps working.
 */
const nodeViewOptions = {
  stopEvent: ({ event }: { event: Event }) => !event.type.startsWith('drag') && event.type !== 'drop',
};

/** A nullable string attribute carried on a `data-*` attribute, left off the element when null. */
const optionalAttribute = (key: string, name: string) => ({
  default: null,
  keepOnSplit: false,
  parseHTML: (element: HTMLElement) => element.getAttribute(name),
  renderHTML: (attributes: Record<string, unknown>) => {
    const value = attributes[key];
    return typeof value === 'string' && value ? { [name]: value } : {};
  },
});

/**
 * `graph` and `graphView` make an equation plottable in 3D: the expression and any view settings
 * that differ from the defaults (`@repo/shared/utils`, `utils/graph/expression.util.ts`). Null on most equations.
 */
const mathAttributes = {
  latex: {
    default: '',
    parseHTML: (element: HTMLElement) => element.getAttribute('data-latex') ?? '',
    renderHTML: (attributes: Record<string, unknown>) => ({ 'data-latex': String(attributes.latex ?? '') }),
  },
  graph: optionalAttribute('graph', 'data-graph'),
  graphView: optionalAttribute('graphView', 'data-graph-view'),
};

/** `$$…$$` before `$…$`, so a display equation is never read as two inline ones. */
const INLINE_PASTE = /(?<!\$)\$([^$\n]+?)\$(?!\$)/g;
const BLOCK_PASTE = /\$\$([\s\S]+?)\$\$/g;

/**
 * `atom: true` is what makes an equation safe to author around: the node is indivisible, so a
 * backspace at its edge removes the whole equation or nothing, never half of it.
 */
export const InlineMath = Node.create({
  name: INLINE_MATH_NAME,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes: () => mathAttributes,

  parseHTML: () => [{ tag: 'span[data-inline-math]' }],

  renderHTML: ({ HTMLAttributes }) => ['span', mergeAttributes(HTMLAttributes, { 'data-inline-math': '' })],

  addNodeView: () => ReactNodeViewRenderer(MathNodeView, nodeViewOptions),

  addCommands() {
    return {
      insertInlineMath:
        (latex) =>
        ({ state, chain }) => {
          const { from, to, empty } = state.selection;
          const seed = latex ?? (empty ? '' : state.doc.textBetween(from, to, ' ').trim());
          return chain()
            .insertContent({ type: this.name, attrs: { latex: seed } })
            .run();
        },

      setMathLatex:
        (pos, latex) =>
        ({ state, tr, dispatch }) => {
          const node = state.doc.nodeAt(pos);
          if (!node || (node.type.name !== INLINE_MATH_NAME && node.type.name !== BLOCK_MATH_NAME)) return false;
          if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, latex });
          return true;
        },

      duplicateMath:
        (pos) =>
        ({ state, tr, dispatch }) => {
          const node = state.doc.nodeAt(pos);
          if (!node || (node.type.name !== INLINE_MATH_NAME && node.type.name !== BLOCK_MATH_NAME)) return false;
          if (dispatch) tr.insert(pos + node.nodeSize, node.type.create(node.attrs));
          return true;
        },

      toggleMathDisplayMode:
        (pos) =>
        ({ state, tr, dispatch }) => {
          const node = state.doc.nodeAt(pos);
          if (!node) return false;
          const inline = state.schema.nodes[INLINE_MATH_NAME];
          const block = state.schema.nodes[BLOCK_MATH_NAME];
          const paragraph = state.schema.nodes.paragraph;
          if (node.type === inline) {
            // A block cannot live inside a paragraph, so the equation moves to just after the
            // textblock that holds it. Insert first: a position after `pos` is unaffected by the
            // deletion that follows.
            const $pos = state.doc.resolve(pos);
            const after = $pos.after($pos.depth);
            if (dispatch) {
              tr.insert(after, block.create(node.attrs));
              tr.delete(pos, pos + node.nodeSize);
            }
            return true;
          }
          if (node.type === block) {
            // The other way round it becomes a paragraph of its own, so the author can type around it.
            if (dispatch) {
              tr.replaceWith(pos, pos + node.nodeSize, paragraph.create(null, inline.create(node.attrs)));
            }
            return true;
          }
          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return { 'Mod-e': () => this.editor.commands.insertInlineMath() };
  },

  addInputRules() {
    return [
      /**
       * `$x^2$` becomes an equation on the closing delimiter — the bridge for the author who
       * already knows a little LaTeX, landing on exactly the same node as someone who used the
       * palette.
       *
       * Hand-rolled rather than Tiptap's `nodeInputRule`, which given a capture group replaces
       * only the captured text and re-inserts the last typed character, so `$x^2$` became a node
       * still wrapped in literal `$…$`. The content may not begin or end with whitespace, which is
       * what stops prose about money turning into mathematics.
       */
      new InputRule({
        find: /\$([^\s$][^$\n]*[^\s$]|[^\s$])\$$/,
        handler: ({ state, range, match }) => {
          state.tr.replaceWith(range.from, range.to, this.type.create({ latex: match[1] }));
        },
      }),
    ];
  },

  addPasteRules() {
    // Pasted `$…$` from a question bank or a chat becomes real equations rather than literal
    // dollar signs, so pasted content is editable on arrival.
    return [
      nodePasteRule({
        find: INLINE_PASTE,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1].trim() }),
      }),
    ];
  },
});

export const BlockMath = Node.create({
  name: BLOCK_MATH_NAME,
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes: () => mathAttributes,

  parseHTML: () => [{ tag: 'div[data-block-math]' }],

  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-block-math': '' })],

  addNodeView: () => ReactNodeViewRenderer(MathNodeView, nodeViewOptions),

  addCommands() {
    return {
      insertBlockMath:
        (latex = '') =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { latex } }),

      // Seeding the node with a bare arrow is what makes it open straight into the
      // reactants/products form rather than a maths field that cannot edit mhchem.
      insertChemicalEquation:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { latex: EMPTY_REACTION_LATEX } }),
    };
  },

  addKeyboardShortcuts() {
    return { 'Mod-Shift-e': () => this.editor.commands.insertBlockMath() };
  },

  addInputRules() {
    return [
      // `$$` then a space opens a display equation with the field focused. Enter cannot be the
      // trigger: ProseMirror input rules run on text input, and Enter is a key handler.
      nodeInputRule({ find: /^\$\$\s$/, type: this.type, getAttributes: () => ({ latex: '' }) }),
    ];
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: BLOCK_PASTE,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1].trim() }),
      }),
    ];
  },
});

/** Both equation nodes, in the order the editor registers them. */
export const MathExtensions = [InlineMath, BlockMath];
