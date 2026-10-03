import type { IRichTextNode } from '../interfaces/rich-text.interface';

/**
 * The picture block. `src` is one of three things: the address of an object in our own bucket,
 * signed by the reader on display; any other `https:` address, shown as it is; or `figure:<ref>`,
 * a placeholder in an AI reply that the importer swaps for the uploaded figure's address.
 */
export const IMAGE_NODE = 'image';
export const FIGURE_REF_PREFIX = 'figure:';
export const IMAGE_WIDTHS = ['small', 'medium', 'full'] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

/** An image node with every attribute present, so the editor and the reader see the same shape. */
export const imageNode = (src: string, alt: string, caption: string, width: ImageWidth = 'full'): IRichTextNode => ({
  type: IMAGE_NODE,
  attrs: { src, alt, caption, width },
});

/** Every image `src` in a document, in document order, repeats included. */
export const collectImageSources = (doc: IRichTextNode | null): string[] => {
  if (!doc) return [];
  const own = doc.type === IMAGE_NODE && typeof doc.attrs?.src === 'string' ? [doc.attrs.src] : [];
  return (doc.content ?? []).reduce<string[]>((all, child) => all.concat(collectImageSources(child)), own);
};

/** The same document with each image `src` passed through `map`; nothing else is touched. */
export const mapImageSources = <T extends IRichTextNode>(node: T, map: (src: string) => string): T => {
  const attrs =
    node.type === IMAGE_NODE && typeof node.attrs?.src === 'string'
      ? { ...node.attrs, src: map(node.attrs.src) }
      : node.attrs;
  const content = node.content?.map((child) => mapImageSources(child, map));
  return { ...node, ...(attrs ? { attrs } : {}), ...(content ? { content } : {}) };
};
