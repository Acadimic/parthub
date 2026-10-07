import { graphAttrsOfNode, type IGraphAttrs } from '@repo/shared/utils';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useEffect, useId, useRef, useState } from 'react';
import { GRAPH_MODAL_ID, GraphButton } from '../../content/GraphButton';
import { MathRender } from '../../content/MathRender';
import { cn } from '../../lib/cn';
import { isBlankEquation } from '../equation/chemistry';
import { EquationEditor } from '../equation/EquationEditor';
import { BLOCK_MATH_NAME } from './math-names';

/**
 * Each equation owns its own `isEditing` flag, so nothing stops two of them being open at once —
 * two palettes, two fields, and no way to tell which one a keystroke belongs to. A window event is
 * the coordination point because node views are independent React roots with no shared ancestor to
 * hold the state.
 */
const OPEN_EDITOR_EVENT = 'parthhub:equation-editor-opened';

/**
 * One view for both equation nodes: an equation is the same object whether it sits in a sentence
 * or on its own line, and only its typesetting and wrapper element differ.
 *
 * Clicking enters edit mode in place — the requirement the previous editor could not meet, where
 * changing one character of an existing equation meant reopening the dialog tree that built it.
 */
export const MathNodeView = ({ node, updateAttributes, deleteNode, editor, getPos }: NodeViewProps) => {
  const displayMode = node.type.name === BLOCK_MATH_NAME;
  const latex = String(node.attrs.latex ?? '');
  const graph = graphAttrsOfNode(node.attrs);
  /**
   * A freshly inserted equation opens straight into its editor.
   *
   * Emptiness is the signal: the toolbar, `Ctrl+E` and the `$$` input rule all insert a node with
   * no LaTeX, and a *committed* equation can never be empty because `stopEditing` deletes it
   * instead. Without this the author presses "insert equation" and gets an empty placeholder chip
   * they have to find and click before they can type anything into it.
   */
  const [isEditing, setIsEditing] = useState(() => isBlankEquation(latex) && editor.isEditable);
  // Captured on entry so Escape can put back what was there — the graph included — including for an
  // equation that was inserted empty and then abandoned.
  const [draftOrigin, setDraftOrigin] = useState(latex);
  const [graphOrigin, setGraphOrigin] = useState<IGraphAttrs | null>(graph);

  const Wrapper = displayMode ? 'div' : 'span';
  const viewId = useId();
  const editorRef = useRef<HTMLElement>(null);

  /** The node's current position, or undefined mid-transaction. */
  const currentPos = () => (typeof getPos === 'function' ? getPos() : undefined);

  const startEditing = () => {
    if (!editor.isEditable) return;
    setDraftOrigin(latex);
    setGraphOrigin(graph);
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
    // nowhere. The position is only valid against the document as it stands right now — clamping
    // to the current doc size is what stops a stale position throwing `RangeError: Selection passed
    // to setSelection must point at the current document`.
    const position = currentPos();
    if (typeof position !== 'number') return;
    const target = Math.min(position + node.nodeSize, editor.state.doc.content.size);
    editor.chain().focus().setTextSelection(target).run();
  };

  const cancelEditing = () => {
    updateAttributes({
      latex: draftOrigin,
      graph: graphOrigin?.graph ?? null,
      graphView: graphOrigin?.graphView ?? null,
    });
    setIsEditing(false);
    if (isBlankEquation(draftOrigin)) deleteNode();
  };

  /**
   * Inline ↔ display, without leaving edit mode conceptually: the node is replaced by its sibling
   * type, and the new node opens its own editor because a converted equation is never blank... so
   * this closes the panel first and lets the author click the moved equation, which now sits where
   * the new type puts it.
   */
  const toggleDisplayMode = () => {
    const position = currentPos();
    if (typeof position !== 'number') return;
    setIsEditing(false);
    editor.chain().focus().toggleMathDisplayMode(position).run();
  };

  const duplicate = () => {
    const position = currentPos();
    if (typeof position !== 'number') return;
    editor.chain().focus().duplicateMath(position).run();
  };

  // Read through a ref inside the listener below, which is bound once per editing session and would
  // otherwise close over the first render's `latex`.
  const commitRef = useRef(stopEditing);
  commitRef.current = stopEditing;

  /**
   * Clicking away commits, the way every other field on these screens behaves. Three exclusions,
   * all portalled outside this subtree and none of them "away": the palette and formula gallery
   * popovers, MathLive's virtual keyboard, and the button that hides that keyboard.
   */
  useEffect(() => {
    if (!isEditing) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || editorRef.current?.contains(target)) return;
      if (
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest(`#${GRAPH_MODAL_ID}`) ||
        target.closest('.ML__keyboard') ||
        target.closest('[data-virtual-keyboard-dismiss]')
      ) {
        return;
      }
      commitRef.current();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isEditing]);

  /**
   * Bring the whole panel into view when it opens, and keep it whole as it grows — adding a step
   * to a reaction makes it ~100px taller. `block: 'nearest'` scrolls nothing when it already fits.
   */
  useEffect(() => {
    if (!isEditing) return undefined;
    const element = editorRef.current;
    const reveal = () => element?.scrollIntoView({ block: 'nearest' });
    const frame = requestAnimationFrame(reveal);
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
      onToggleDisplayMode={toggleDisplayMode}
      onDuplicate={duplicate}
      graph={graph}
      onGraphChange={(next) => updateAttributes({ graph: next?.graph ?? null, graphView: next?.graphView ?? null })}
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
   * An inline equation floats its editor rather than sitting it in the text flow: rendered inline
   * the ~400px panel splits the sentence it belongs to across three lines. Absolute positioning
   * takes it out of flow, and the equation itself keeps rendering in place.
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
          className="absolute left-0 top-full z-50 mt-1 block w-[32rem] max-w-[85vw] text-left"
        >
          {equationEditor}
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    // A display equation with a graph lays its cube beside it rather than on a line of its own.
    <NodeViewWrapper
      as={Wrapper}
      className={displayMode ? cn('my-3', graph ? 'flex items-center gap-2' : 'block') : 'inline'}
    >
      {/* A real <button>, not a span with role="button": Tiptap's default `stopEvent` only keeps
          ProseMirror's hands off events whose target is a genuine form control. A span let
          ProseMirror's own `selectClickedLeaf` run on mouseup, racing the React state change. */}
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
      {graph ? <GraphButton latex={latex} {...graph} /> : null}
    </NodeViewWrapper>
  );
};
