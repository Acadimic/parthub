import type { IRichTextNode } from '../interfaces/rich-text.interface';

/** A flattened list opens with a bullet marker. */
const ITEM_START = /^\s*-\s+/;
/**
 * Where one flattened item ends and the next begins: a spaced hyphen inside the text. Only `-`:
 * a spaced `+` is prose ("voy a + infinitive"), and the generated lists always used `-`.
 */
const ITEM_BREAK = /\s+-\s+(?=\S)/;

const isText = (node: IRichTextNode): boolean =>
  node.type === 'text' && !node.marks?.some((mark) => mark.type === 'code');

/**
 * Whether a paragraph is a bullet list that lost its structure: "- a - b - c" on one line. The
 * Markdown import used to join every line of a `>` quote into one paragraph, which is how the
 * "Important notes" list of most generated lessons was stored.
 */
const isFlattenedList = (node: IRichTextNode): boolean => {
  const first = node.content?.[0];
  return node.type === 'paragraph' && !!first && isText(first) && ITEM_START.test(first.text ?? '');
};

const trimEnd = (nodes: IRichTextNode[]): IRichTextNode[] => {
  const last = nodes[nodes.length - 1];
  if (last?.type !== 'text') return nodes;
  const text = (last.text ?? '').replace(/\s+$/, '');
  return text ? [...nodes.slice(0, -1), { ...last, text }] : nodes.slice(0, -1);
};

/** The paragraph's items as a bullet list; marks and equations stay in the item they were in. */
const toBulletList = (paragraph: IRichTextNode): IRichTextNode => {
  const items: IRichTextNode[][] = [[]];
  (paragraph.content ?? []).forEach((node, index) => {
    if (!isText(node)) {
      items[items.length - 1].push(node);
      return;
    }
    const text = index === 0 ? (node.text ?? '').replace(ITEM_START, '') : (node.text ?? '');
    text.split(ITEM_BREAK).forEach((part, partIndex) => {
      if (partIndex > 0) items.push([]);
      if (part) items[items.length - 1].push({ ...node, text: part });
    });
  });
  const content = items
    .map(trimEnd)
    .filter((item) => item.length)
    .map((item) => ({ type: 'listItem', content: [{ type: 'paragraph', content: item }] }));
  return { type: 'bulletList', content };
};

/** Restores the bullet lists flattened inside top-level quotes, and counts the quotes it changed. */
export const repairQuoteLists = (blocks: IRichTextNode[]): { blocks: IRichTextNode[]; repairs: number } => {
  let repairs = 0;
  const repaired = blocks.map((block) => {
    if (block.type !== 'blockquote' || !block.content?.some(isFlattenedList)) return block;
    repairs += 1;
    return { ...block, content: block.content.map((child) => (isFlattenedList(child) ? toBulletList(child) : child)) };
  });
  return { blocks: repaired, repairs };
};
