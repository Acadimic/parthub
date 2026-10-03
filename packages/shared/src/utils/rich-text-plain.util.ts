import { RichTextFormat } from '../enums/rich-text.enum';
import type { IRichText, IRichTextNode } from '../interfaces/rich-text.interface';
import { IMAGE_NODE } from './rich-text-image.util';

/**
 * An empty authored value.
 *
 * A function rather than a constant so callers cannot share — and then mutate — one object. The
 * document is a single empty paragraph rather than no content at all, because ProseMirror requires
 * a block to place the caret in and an editor loaded with `content: []` renders nothing typeable.
 */
export const createEmptyRichText = (): IRichText => ({
  format: RichTextFormat.DOC_V1,
  doc: { type: 'doc', content: [{ type: 'paragraph' }] },
  text: '',
});

/** Containers whose children are inline, and so join without a newline between them. */
export const INLINE_CONTAINERS = new Set(['paragraph', 'heading', 'codeBlock']);

/** The text of a node that has no children to walk: an equation's LaTeX, a picture's description. */
const leafText = (node: IRichTextNode): string | null => {
  if (node.type === 'inlineMath' || node.type === 'blockMath') return String(node.attrs?.latex ?? '');
  // A picture reads as its description, so a document holding only an image is not "empty".
  if (node.type === IMAGE_NODE) return String(node.attrs?.alt || node.attrs?.caption || 'Image');
  return null;
};

/**
 * Document → plain text, equations reduced to their LaTeX.
 *
 * The projection stored on every `IRichText`. It lives here rather than beside the editor because
 * both sides need it: the editor computes it on each keystroke, and the importers below compute it
 * for content that never passed through an editor at all.
 */
export const docToPlainText = (doc: IRichTextNode | null): string => {
  if (!doc) return '';
  const walk = (node: IRichTextNode): string => {
    if (node.type === 'text') return node.text ?? '';
    const leaf = leafText(node);
    if (leaf !== null) return leaf;
    // A row reads across, so its cells sit on one line; the table's rows then stack as usual.
    if (node.type === 'tableRow') return (node.content ?? []).map(walk).join('\t');
    return (node.content ?? []).map(walk).join(INLINE_CONTAINERS.has(node.type) ? '' : '\n');
  };
  return walk(doc)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/** True when the value holds no readable text. Cheap: reads the projection, never walks `doc`. */
export const isRichTextEmpty = (value?: IRichText | null): boolean => !value?.text?.trim();
