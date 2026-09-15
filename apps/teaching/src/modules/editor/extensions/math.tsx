import { InputRule, mergeAttributes, Node, nodeInputRule } from '@tiptap/core';
import { NodeViewWrapper, type NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { MathRender } from '@repo/ui/core';
import { useEffect, useId, useRef, useState } from 'react';
import { EquationEditor } from '../components/EquationEditor';
import { isBlankEquation } from '../lib/palette';

/**
 * Each equation owns its own `isEditing` flag, so nothing stops two of them being open at once —
 * two palettes, two fields, and no way to tell which one a keystroke belongs to. A window event is
 * the coordination point because node views are independent React roots with no shared ancestor to
 * hold the state.
 */
const OPEN_EDITOR_EVENT = 'parthhub:equation-editor-opened';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    math: {
      insertInlineMath: (latex?: string) => ReturnType;
      insertBlockMath: (latex?: string) => ReturnType;
    };
  }
}

/**
 * One view for both nodes: an equation is the same object whether it sits in a sentence or on its
 * own line, and only its typesetting and wrapper element differ.
 *
 * Clicking enters edit mode in place. That is the requirement the previous editor could not meet —
 * there, changing one character of an existing equation meant reopening the dialog tree that built
 * it.
 */
const MathNodeView = ({ node, updateAttributes, deleteNode, editor, getPos }: NodeViewProps) => {
  const displayMode = node.type.name === 'blockMath';
  const latex = String(node.attrs.latex ?? '');
  /**
   * A freshly inserted equation opens straight into its editor.
   *
   * Emptiness is the signal: the toolbar, `Ctrl+E` and the `$$` input rule all insert a node with
   * no LaTeX, and a *committed* equation can never be empty because `stopEditing` deletes it
   * instead. Without this the author presses "insert equation" and gets an empty placeholder chip
   * they have to find and click before they can type anything into it.
   */
  const [isEditing, setIsEditing] = useState(() => isBlankEquation(latex) && editor.isEditable);
  // Captured on entry so Escape can put back what was there, including for an equation that was
  // inserted empty and then abandoned.
  const [draftOrigin, setDraftOrigin] = useState(latex);

  const Wrapper = displayMode ? 'div' : 'span';
  const viewId = useId();
  const editorRef = useRef<HTMLElement>(null);

  const startEditing = () => {
    if (!editor.isEditable) return;
    setDraftOrigin(latex);
    setIsEditing(true);
    window.dispatchEvent(new CustomEvent(OPEN_EDITOR_EVENT, { detail: viewId }));
  };

  // An equation that opened itself still has to close any other open one.
  useEffect(() => {
    if (isEditing) window.dispatchEvent(new CustomEvent(OPEN_EDITOR_EVENT, { detail: viewId }));
    // Mount only: later opens go through `startEditing`, which announces itself.
  }, []);

  // Close when a different equation opens, so only one field is ever live.
  useEffect(() => {
    if (!isEditing) return undefined;
    const onOpened = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== viewId) setIsEditing(false);
    };
    window.addEventListener(OPEN_EDITOR_EVENT, onOpened);
    return () => window.removeEventListener(OPEN_EDITOR_EVENT, onOpened);
  }, [isEditing, viewId]);

  const stopEditing = () => {
    setIsEditing(false);
    // An equation left empty is not a document the author wants; dropping it avoids an invisible
    // node they cannot click to remove.
    if (isBlankEquation(latex)) {
      deleteNode();
      return;
    }
    // Put the caret back after the node, so typing continues the sentence rather than landing
    // nowhere. `getPos` is a function on a node view and can return undefined mid-transaction, and
    // the position it returns is only valid against the document as it stands right now — clamping
    // to the current doc size is what stops a stale position throwing `RangeError: Selection passed
    // to setSelection must point at the current document`.
    const position = typeof getPos === 'function' ? getPos() : undefined;
    if (typeof position !== 'number') return;
    const target = Math.min(position + node.nodeSize, editor.state.doc.content.size);
    editor.chain().focus().setTextSelection(target).run();
  };

  const cancelEditing = () => {
    updateAttributes({ latex: draftOrigin });
    setIsEditing(false);
    if (isBlankEquation(draftOrigin)) deleteNode();
  };

  // Read through a ref inside the listener below, which is bound once per editing session and would
  // otherwise close over the first render's `latex`.
  const commitRef = useRef(stopEditing);
  commitRef.current = stopEditing;

  /**
   * Clicking away commits, the way every other field on these screens behaves. Without it the
   * editor stays open indefinitely once focus moves elsewhere — and since Enter is handled by the
   * field, a blurred field cannot be closed by the keyboard either.
   *
   * Two exclusions, both portalled outside this subtree and neither of them "away": the palette and
   * formula gallery popovers, and MathLive's virtual keyboard.
   */
  useEffect(() => {
    if (!isEditing) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || editorRef.current?.contains(target)) return;
      if (target.closest('[data-radix-popper-content-wrapper]') || target.closest('.ML__keyboard')) return;
      commitRef.current();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isEditing]);

  /**
   * Bring the whole panel into view when it opens.
   *
   * The editor pane scrolls, and an equation sitting near its bottom edge opens a panel taller than
   * the space left below it — the author gets the header and the field, while the live preview and
   * the token row are clipped off the bottom with nothing to say they are there. `block: 'nearest'`
   * scrolls the least amount that makes the panel whole, so an equation already fully visible does
   * not move at all.
   */
  useEffect(() => {
    if (!isEditing) return undefined;
    const element = editorRef.current;
    const reveal = () => element?.scrollIntoView({ block: 'nearest' });
    const frame = requestAnimationFrame(reveal);
    // The panel also grows after it opens — adding a step to a reaction makes it ~100px taller —
    // and a single scroll on open leaves the new height hanging below the fold. Watching its size
    // keeps it whole; `block: 'nearest'` scrolls nothing when it already fits, so this is inert for
    // a panel that never changes shape.
    if (!element || typeof ResizeObserver === 'undefined') return () => cancelAnimationFrame(frame);
    const observer = new ResizeObserver(reveal);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [isEditing]);

  const equationEditor = (
    <EquationEditor
      latex={latex}
      displayMode={displayMode}
      onChange={(value) => updateAttributes({ latex: value })}
      onDone={stopEditing}
      onCancel={cancelEditing}
      onDelete={deleteNode}
    />
  );

  if (isEditing && displayMode) {
    return (
      <NodeViewWrapper as="div" className="my-3 block">
        <div contentEditable={false} ref={editorRef as React.RefObject<HTMLDivElement>}>
          {equationEditor}
        </div>
      </NodeViewWrapper>
    );
  }

  /**
   * An inline equation floats its editor rather than sitting it in the text flow.
   *
   * The panel is some 400px wide and 100px tall; rendered inline it splits the sentence it belongs
   * to across three lines and shunts the following words around, so the author loses the context
   * they are editing against. Absolute positioning takes it out of flow, and the equation itself
   * keeps rendering in place — the line never moves while it is being edited.
   */
  if (isEditing) {
    return (
      <NodeViewWrapper as="span" className="relative inline-block align-middle">
        <span className="inline-block border border-primary bg-accent/40 px-0.5">
          <MathRender latex={latex} />
        </span>
        <span
          contentEditable={false}
          ref={editorRef}
          className="absolute left-0 top-full z-50 mt-1 block w-[30rem] max-w-[85vw] text-left"
        >
          {equationEditor}
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as={Wrapper} className={displayMode ? 'my-3 block' : 'inline'}>
      {/* A real <button>, not a span with role="button". Two reasons, and the second is load-bearing:
          it is the correct element for something that is activated, and Tiptap's default
          `stopEvent` only keeps ProseMirror's hands off events whose target is a genuine form
          control. A span let ProseMirror's own `selectClickedLeaf` run on mouseup, racing the React
          state change below — see the `stopEvent` note on the node views. */}
      <button
        type="button"
        contentEditable={false}
        aria-label={`Equation: ${latex}. Activate to edit.`}
        onClick={startEditing}
        className={
          displayMode
            ? 'block w-full cursor-pointer appearance-none border border-transparent bg-transparent px-2 py-1 text-center hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            : 'inline-block cursor-pointer appearance-none border border-transparent bg-transparent px-0.5 align-middle hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        }
      >
        <MathRender latex={latex} displayMode={displayMode} />
      </button>
    </NodeViewWrapper>
  );
};

/**
 * ProseMirror must not handle events that land inside an equation.
 *
 * Without this, its `selectClickedLeaf` runs on mouseup over the atom and applies a NodeSelection
 * computed *before* the click opened the editor. React has re-rendered the node view by then, so
 * the position no longer maps to the current document and ProseMirror throws
 * `RangeError: Selection passed to setSelection must point at the current document` on the very
 * first click of an equation.
 *
 * Drag events are deliberately let through so `draggable: true` keeps working.
 */
const mathNodeViewOptions = {
  stopEvent: ({ event }: { event: Event }) => !event.type.startsWith('drag') && event.type !== 'drop',
};

const latexAttribute = {
  latex: {
    default: '',
    parseHTML: (element: HTMLElement) => element.getAttribute('data-latex') ?? '',
    renderHTML: (attributes: Record<string, unknown>) => ({ 'data-latex': String(attributes.latex ?? '') }),
  },
};

/**
 * `atom: true` is what makes an equation safe to author around: the node is indivisible, so a
 * backspace at its edge removes the whole equation or nothing, never half of it. In a
 * Markdown-canonical document the same equation is a text range between two `$` that a stray
 * keystroke silently corrupts.
 */
export const InlineMath = Node.create({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes: () => latexAttribute,

  parseHTML: () => [{ tag: 'span[data-inline-math]' }],

  renderHTML: ({ HTMLAttributes }) => ['span', mergeAttributes(HTMLAttributes, { 'data-inline-math': '' })],

  addNodeView: () => ReactNodeViewRenderer(MathNodeView, mathNodeViewOptions),

  addCommands() {
    return {
      insertInlineMath:
        (latex = '') =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { latex } }),
    };
  },

  addInputRules() {
    return [
      /**
       * `$x^2$` becomes an equation on the closing delimiter — the bridge for the author who
       * already knows a little LaTeX, landing on exactly the same node as someone who used the
       * palette.
       *
       * Hand-rolled rather than Tiptap's `nodeInputRule`, which is the wrong tool here: given a
       * capture group it replaces only the captured text and re-inserts the last typed character,
       * so `$x^2$` became a node still wrapped in literal `$…$`.
       *
       * The content may not begin or end with whitespace, which is what stops prose about money
       * turning into mathematics — "the pen costs $5 and the book $3" has the content "5 and the
       * book " between its dollars, and is left alone.
       */
      new InputRule({
        find: /\$([^\s$][^$\n]*[^\s$]|[^\s$])\$$/,
        handler: ({ state, range, match }) => {
          state.tr.replaceWith(range.from, range.to, this.type.create({ latex: match[1] }));
        },
      }),
    ];
  },
});

export const BlockMath = Node.create({
  name: 'blockMath',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes: () => latexAttribute,

  parseHTML: () => [{ tag: 'div[data-block-math]' }],

  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-block-math': '' })],

  addNodeView: () => ReactNodeViewRenderer(MathNodeView, mathNodeViewOptions),

  addCommands() {
    return {
      insertBlockMath:
        (latex = '') =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { latex } }),
    };
  },

  addInputRules() {
    return [
      // `$$` then a space opens a display equation with the field focused. Enter cannot be the
      // trigger: ProseMirror input rules run on text input, and Enter is a key handler.
      nodeInputRule({ find: /^\$\$\s$/, type: this.type, getAttributes: () => ({ latex: '' }) }),
    ];
  },
});
