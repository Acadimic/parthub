import { RichTextFormat } from '@repo/shared/enums';
import type { IRichText, IRichTextDoc, IRichTextNode } from '@repo/shared/interfaces';
import { docToPlainText } from '@repo/shared/utils';
import { BLOCK_MATH_NAME, INLINE_MATH_NAME } from './extensions/math-names';

/**
 * Wraps a bare ProseMirror document as a stored value, computing the projection.
 *
 * For the callers that start from a document rather than from the editor — seed content, an
 * import, a generated question. `RichTextEditor` does the same thing on every keystroke; this is
 * the one other way a value should ever be built, so the projection is never hand-written.
 */
export const toRichText = (doc: IRichTextDoc): IRichText => ({
  format: RichTextFormat.DOC_V1,
  doc,
  text: docToPlainText(doc),
});

/** Every distinct equation in the document, for the render check the plan puts on every write. */
export const collectEquations = (doc: IRichTextNode | null): string[] => {
  const found: string[] = [];
  const walk = (node: IRichTextNode) => {
    if (node.type === INLINE_MATH_NAME || node.type === BLOCK_MATH_NAME) {
      const latex = String(node.attrs?.latex ?? '');
      if (latex && !found.includes(latex)) found.push(latex);
    }
    (node.content ?? []).forEach(walk);
  };
  if (doc) walk(doc);
  return found;
};
