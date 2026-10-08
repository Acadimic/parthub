import type { IRichTextNode, RichTextAttrValue } from '../../interfaces/rich-text.interface';
import { graphAttrsFromMarkdown, type IGraphAttrs } from './expression.util';

/**
 * The Markdown reader's handling of 3D graphs: the `{graph=…}` block after an equation.
 *
 * After an inline equation the block is lifted out of the line before the marks pass — an
 * expression such as `(x)*(y)*2` would otherwise read as italic — and held as a private-use slot
 * that the equation then claims. A slot no equation claims goes back to its text, so nothing is lost.
 */
const GRAPH_AFTER_INLINE_MATH = /(?<=\$|\\\))\{\s*graph=(?:"(?:[^"\\]|\\.)*"|[^\s"}]+)[^}]*\}/g;
const GRAPH_SLOT = /(\d+)/g;
const GRAPH_SLOT_AT_START = /^(\d+)/;

export interface IGraphSlot {
  source: string;
  attrs: IGraphAttrs | null;
}

/** An equation node's graph attributes, or none when there is no graph to draw. */
export const graphNodeAttrs = (attrs: IGraphAttrs | null): Record<string, RichTextAttrValue> =>
  attrs ? { graph: attrs.graph, graphView: attrs.graphView } : {};

/** The same, read from the inside of an attribute block when one followed a display equation. */
export const graphNodeAttrsFromMarkdown = (source: string | undefined): Record<string, RichTextAttrValue> =>
  graphNodeAttrs(source ? graphAttrsFromMarkdown(source) : null);

/** Replaces each graph block after an inline equation with a slot, and returns the slots. */
export const holdGraphBlocks = (line: string): { held: string; slots: IGraphSlot[] } => {
  const slots: IGraphSlot[] = [];
  const held = line.replace(GRAPH_AFTER_INLINE_MATH, (source) => {
    slots.push({ source, attrs: graphAttrsFromMarkdown(source.slice(1, -1)) });
    return `${slots.length - 1}`;
  });
  return { held, slots };
};

/** Puts every unclaimed slot in `text` back as the block it was taken from. */
export const restoreGraphSlots = (text: string, slots: IGraphSlot[]): string =>
  text.replace(GRAPH_SLOT, (_match, index: string) => slots[Number(index)].source);

/** The slot at the start of `text`, if one is there: the graph it holds and the text after it. */
export const claimGraphSlot = (
  text: string,
  slots: IGraphSlot[],
): { attrs: Record<string, RichTextAttrValue>; rest: string } | null => {
  const claimed = GRAPH_SLOT_AT_START.exec(text);
  return claimed
    ? { attrs: graphNodeAttrs(slots[Number(claimed[1])].attrs), rest: text.slice(claimed[0].length) }
    : null;
};

/**
 * Moves the graph in a slot at the start of `text` onto the inline equation just before it, and
 * returns the text that is left. Anything else leaves `text` as it is.
 */
export const attachGraphSlot = (equation: IRichTextNode | undefined, text: string, slots: IGraphSlot[]): string => {
  const claimed = claimGraphSlot(text, slots);
  if (!claimed || equation?.type !== 'inlineMath' || !equation.attrs) return text;
  equation.attrs = { ...equation.attrs, ...claimed.attrs };
  return claimed.rest;
};
