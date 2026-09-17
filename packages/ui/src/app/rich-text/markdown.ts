import { RichTextFormat } from '@repo/shared/enums';
import { docToPlainText } from '@repo/shared/utils';
import type { IRichText, IRichTextDoc, IRichTextNode } from '@repo/shared/interfaces';

/**
 * ProseMirror document → Markdown.
 *
 * The direction that proves the format: if the document serializes cleanly, the stored JSON is not
 * a private encoding — it is a document that can leave the product, be handed to a model, or be
 * diffed. The reverse direction (Markdown → document) is the AI and file-import write path and is
 * Phase 3 in the plan; this half is here so the spike can show its output.
 *
 * Mark ordering is fixed rather than following the order marks happen to appear on a text node,
 * because `**_x_**` and `_**x**_` are the same document and two different strings — a stable order
 * is what makes a round-trip test meaningful.
 */
const MARK_WRAPPERS: Record<string, string> = {
  bold: '**',
  italic: '_',
  strike: '~~',
  code: '`',
};

const MARK_ORDER = ['bold', 'italic', 'strike', 'code'];

/**
 * A bare `$` in prose would be read as the start of an equation on re-import — "the pen costs $3
 * and the book $5" is the case that breaks a naive serializer. Backslash-escaping is what keeps
 * the round trip honest.
 */
const escapeText = (text: string): string => text.replace(/\$/g, '\\$');

const applyMarks = (text: string, node: IRichTextNode): string => {
  const marks = node.marks ?? [];
  if (!marks.length) return text;

  const link = marks.find((mark) => mark.type === 'link');
  let result = text;

  MARK_ORDER.forEach((type) => {
    if (!marks.some((mark) => mark.type === type)) return;
    const wrapper = MARK_WRAPPERS[type];
    // `code` is literal: Markdown does not interpret anything inside a code span, so an escape
    // added for prose would be rendered verbatim as a backslash.
    if (type === 'code') result = `${wrapper}${result.replace(/\\\$/g, '$')}${wrapper}`;
    else result = `${wrapper}${result}${wrapper}`;
  });

  if (link) result = `[${result}](${String(link.attrs?.href ?? '')})`;
  return result;
};

const serializeInline = (nodes: IRichTextNode[] = []): string =>
  nodes
    .map((node) => {
      if (node.type === 'text') return applyMarks(escapeText(node.text ?? ''), node);
      if (node.type === 'inlineMath') return `$${String(node.attrs?.latex ?? '')}$`;
      if (node.type === 'hardBreak') return '\\\n';
      return '';
    })
    .join('');

const serializeListItems = (node: IRichTextNode, ordered: boolean): string =>
  (node.content ?? [])
    .map((item, index) => {
      const marker = ordered ? `${index + 1}. ` : '- ';
      const body = (item.content ?? []).map((child) => serializeBlock(child)).join('\n\n');
      // Continuation lines align under the marker, which is what keeps a multi-paragraph item
      // inside the item rather than terminating the list.
      const indent = ' '.repeat(marker.length);
      return `${marker}${body.split('\n').join(`\n${indent}`)}`;
    })
    .join('\n');

const serializeQuote = (node: IRichTextNode): string =>
  (node.content ?? [])
    .map((child) => serializeBlock(child))
    .join('\n\n')
    .split('\n')
    .map((line) => `> ${line}`.trimEnd())
    .join('\n');

const serializeCodeBlock = (node: IRichTextNode): string => {
  const language = String(node.attrs?.language ?? '');
  // A fenced block is literal, so the `$` escaping applied for prose has to come back out.
  const body = serializeInline(node.content).replace(/\\\$/g, '$');
  return `\`\`\`${language}\n${body}\n\`\`\``;
};

const serializeHeading = (node: IRichTextNode): string => {
  const level = Number(node.attrs?.level ?? 1);
  return `${'#'.repeat(level)} ${serializeInline(node.content)}`;
};

/** The blocks with no attributes to read and no nesting to flatten. */
const SIMPLE_BLOCKS: Record<string, (node: IRichTextNode) => string> = {
  paragraph: (node) => serializeInline(node.content),
  heading: serializeHeading,
  blockMath: (node) => `$$\n${String(node.attrs?.latex ?? '')}\n$$`,
  bulletList: (node) => serializeListItems(node, false),
  orderedList: (node) => serializeListItems(node, true),
  blockquote: serializeQuote,
  codeBlock: serializeCodeBlock,
  horizontalRule: () => '---',
};

function serializeBlock(node: IRichTextNode): string {
  const serialize = SIMPLE_BLOCKS[node.type];
  if (serialize) return serialize(node);
  // An unknown block still contributes its text rather than vanishing. Silent loss is the one
  // failure mode a serializer must not have.
  return node.content ? serializeInline(node.content) : '';
}

export const docToMarkdown = (doc: IRichTextNode | null): string => {
  if (!doc?.content) return '';
  return doc.content
    .map((node) => serializeBlock(node))
    .filter((block) => block.trim().length > 0)
    .join('\n\n');
};

/**
 * The plain-text projection stored alongside the document as `IRichText.text`: what search, list
 * previews and CSV export read, so that nothing has to walk the document for them. Equations
 * reduce to their LaTeX, which is imperfect for search but is at least stable and greppable.
 */

/** Every distinct equation in the document, for the render check the plan puts on every write. */
export const collectEquations = (doc: IRichTextNode | null): string[] => {
  const found: string[] = [];
  const walk = (node: IRichTextNode) => {
    if (node.type === 'inlineMath' || node.type === 'blockMath') {
      const latex = String(node.attrs?.latex ?? '');
      if (latex && !found.includes(latex)) found.push(latex);
    }
    (node.content ?? []).forEach(walk);
  };
  if (doc) walk(doc);
  return found;
};

/**
 * Wraps a bare ProseMirror document as a stored value, computing the projection.
 *
 * For the callers that start from a document rather than from the editor — seed content, an
 * import, a generated question. `RichTextEditor` does the same thing on every keystroke; this is
 * the one other way a value should ever be built, so the projection is never hand-written.
 */
export { docToPlainText };

export const toRichText = (doc: IRichTextDoc): IRichText => ({
  format: RichTextFormat.DOC_V1,
  doc,
  text: docToPlainText(doc),
});
