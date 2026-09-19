import { RichTextFormat } from '../enums/rich-text.enum';
import type { IRichText, IRichTextDoc, IRichTextMark, IRichTextNode } from '../interfaces/rich-text.interface';

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
const INLINE_CONTAINERS = new Set(['paragraph', 'heading', 'codeBlock']);

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
    if (node.type === 'inlineMath' || node.type === 'blockMath') return String(node.attrs?.latex ?? '');
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

// ---------------------------------------------------------------------------
// Markdown → document. The inverse of `docToMarkdown` in @repo/ui/editor, and the AI/import write path.
// ---------------------------------------------------------------------------

/** `$$…$$` before `$…$`, and a backslash-escaped `\$` is prose rather than a delimiter. */
const MATH_PATTERN = /(\$\$(?:[^$]|\$(?!\$))+\$\$|(?<!\\)\$(?:\\\$|[^$\n])+?(?<!\\)\$)/;

/** `[text](https://…)`; the label is group 1 and the address group 2, so the mark carries `href`. */
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/;

/** Applied in this order so the earliest match wins consistently. `code` never nests. */
const MARK_PATTERNS: { re: RegExp; type: string; literal?: boolean }[] = [
  { re: /`([^`]+)`/, type: 'code', literal: true },
  { re: LINK_PATTERN, type: 'link' },
  { re: /\*\*([^*]+)\*\*/, type: 'bold' },
  { re: /~~([^~]+)~~/, type: 'strike' },
  { re: /(?<![A-Za-z0-9])_([^_]+)_(?![A-Za-z0-9])/, type: 'italic' },
];

const unescape = (text: string): string => text.replace(/\\\$/g, '$');

const textNode = (text: string, marks: IRichTextMark[]): IRichTextNode =>
  marks.length ? { type: 'text', text, marks } : { type: 'text', text };

/** Parses marks, recursing into what a mark wraps so `**_x_**` keeps both. */
const parseMarked = (input: string, marks: IRichTextMark[]): IRichTextNode[] => {
  if (!input) return [];
  for (const { re, type, literal } of MARK_PATTERNS) {
    const match = re.exec(input);
    if (!match) continue;
    const inner = match[1];
    // A link is the one mark with an attribute: the address it points at.
    const nextMarks = [...marks, type === 'link' ? { type, attrs: { href: match[2] } } : { type }];
    return [
      ...parseMarked(input.slice(0, match.index), marks),
      // Markdown interprets nothing inside a code span, so its content is taken verbatim.
      ...(literal ? [textNode(inner, nextMarks)] : parseMarked(inner, nextMarks)),
      ...parseMarked(input.slice(match.index + match[0].length), marks),
    ];
  }
  return [textNode(unescape(input), marks)];
};

/** Splits a line into equation nodes and marked text. */
const parseInline = (line: string): IRichTextNode[] =>
  line
    .split(MATH_PATTERN)
    .filter(Boolean)
    .reduce<IRichTextNode[]>((nodes, part) => {
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        nodes.push({ type: 'inlineMath', attrs: { latex: part.slice(2, -2).trim() } });
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        nodes.push({ type: 'inlineMath', attrs: { latex: part.slice(1, -1).trim() } });
      } else {
        parseMarked(part, []).forEach((node) => nodes.push(node));
      }
      return nodes;
    }, []);

const listItem = (line: string): IRichTextNode => ({
  type: 'listItem',
  content: [{ type: 'paragraph', content: parseInline(line) }],
});

const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^[-*+]\s+(.*)$/;
const ORDERED = /^\d+[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const RULE = /^(-{3,}|\*{3,}|_{3,})$/;
const DISPLAY_MATH = /^\$\$(.+)\$\$$/;
const FENCE = /^```/;

/** What one reader consumed: the block it produced, and where parsing resumes. */
interface IBlockMatch {
  node: IRichTextNode;
  next: number;
}

type BlockReader = (lines: string[], index: number) => IBlockMatch | null;

const readFence: BlockReader = (lines, index) => {
  if (!FENCE.test(lines[index].trim())) return null;
  const body: string[] = [];
  let cursor = index + 1;
  while (cursor < lines.length && !FENCE.test(lines[cursor].trim())) {
    body.push(lines[cursor]);
    cursor += 1;
  }
  return {
    node: { type: 'codeBlock', content: [{ type: 'text', text: body.join('\n') }] },
    next: cursor + 1, // step past the closing fence
  };
};

const readRule: BlockReader = (lines, index) =>
  RULE.test(lines[index].trim()) ? { node: { type: 'horizontalRule' }, next: index + 1 } : null;

const readDisplayMath: BlockReader = (lines, index) => {
  const match = DISPLAY_MATH.exec(lines[index].trim());
  return match ? { node: { type: 'blockMath', attrs: { latex: match[1].trim() } }, next: index + 1 } : null;
};

const readHeading: BlockReader = (lines, index) => {
  const match = HEADING.exec(lines[index].trim());
  if (!match) return null;
  return {
    node: { type: 'heading', attrs: { level: match[1].length }, content: parseInline(match[2]) },
    next: index + 1,
  };
};

/** Consecutive items of the same kind become one list, which is what the editor stores. */
const readListOf = (pattern: RegExp, type: string): BlockReader => {
  return (lines, index) => {
    if (!pattern.test(lines[index].trim())) return null;
    const items: IRichTextNode[] = [];
    let cursor = index;
    while (cursor < lines.length) {
      const match = pattern.exec(lines[cursor].trim());
      if (!match) break;
      items.push(listItem(match[1]));
      cursor += 1;
    }
    return { node: { type, content: items }, next: cursor };
  };
};

const readQuote: BlockReader = (lines, index) => {
  if (!QUOTE.test(lines[index].trim())) return null;
  const quoted: string[] = [];
  let cursor = index;
  while (cursor < lines.length) {
    const match = QUOTE.exec(lines[cursor].trim());
    if (!match) break;
    quoted.push(match[1]);
    cursor += 1;
  }
  return {
    node: { type: 'blockquote', content: [{ type: 'paragraph', content: parseInline(quoted.join(' ')) }] },
    next: cursor,
  };
};

const TABLE_ROW = /^\|(.*)\|\s*$/;
const TABLE_SEPARATOR = /^\|(\s*:?-{3,}:?\s*\|)+\s*$/;

/** Splits a pipe row into cells, honouring `\|` as a literal pipe inside a cell. */
const splitTableRow = (line: string): string[] =>
  (TABLE_ROW.exec(line.trim())?.[1] ?? '').split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|').trim());

const tableCell = (type: 'tableHeader' | 'tableCell', text: string): IRichTextNode => ({
  type,
  content: [{ type: 'paragraph', content: parseInline(text) }],
});

/**
 * A GFM pipe table: a header row, a separator row, then body rows. The first row becomes header
 * cells, because that is what the separator declares it to be. Borders are not expressible in
 * Markdown, so an imported table draws them.
 */
const readTable: BlockReader = (lines, index) => {
  if (!TABLE_ROW.test(lines[index].trim()) || !TABLE_SEPARATOR.test((lines[index + 1] ?? '').trim())) return null;
  const rows: IRichTextNode[] = [
    { type: 'tableRow', content: splitTableRow(lines[index]).map((text) => tableCell('tableHeader', text)) },
  ];
  let cursor = index + 2;
  while (cursor < lines.length && TABLE_ROW.test(lines[cursor].trim())) {
    rows.push({ type: 'tableRow', content: splitTableRow(lines[cursor]).map((text) => tableCell('tableCell', text)) });
    cursor += 1;
  }
  return { node: { type: 'table', attrs: { bordered: true }, content: rows }, next: cursor };
};

/** Order matters: a fence swallows its body, so it is tried before anything inside it can match. */
const BLOCK_READERS: BlockReader[] = [
  readFence,
  readTable,
  readRule,
  readDisplayMath,
  readHeading,
  readListOf(BULLET, 'bulletList'),
  readListOf(ORDERED, 'orderedList'),
  readQuote,
];

/**
 * Markdown → ProseMirror document.
 *
 * Deliberately narrow: it understands exactly what `docToMarkdown` emits and what the editor can
 * represent — headings 1-3, bullet and ordered lists, blockquotes, fenced code, rules, pipe tables,
 * the four inline marks, and `$…$` / `$$…$$` equations. That is the round trip worth having; a general
 * CommonMark parser would accept constructs the editor cannot store and would lose them on the
 * first save, which is worse than not accepting them.
 *
 * Anything unrecognised stays a paragraph, so no input is ever dropped.
 */
const parseBlocks = (markdown: string): IRichTextNode[] => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: IRichTextNode[] = [];
  let index = 0;

  while (index < lines.length) {
    if (!lines[index].trim()) {
      index += 1;
      continue;
    }
    const match = BLOCK_READERS.reduce<IBlockMatch | null>((found, read) => found ?? read(lines, index), null);
    if (match) {
      blocks.push(match.node);
      index = match.next;
      continue;
    }
    blocks.push({ type: 'paragraph', content: parseInline(lines[index].trim()) });
    index += 1;
  }

  return blocks;
};

/**
 * Builds a stored value from Markdown-ish text.
 *
 * The write path for everything that does not come from the editor: content a model generated, an
 * import, a paste. Equations become real nodes rather than literal dollar signs, so generated
 * content is editable on arrival instead of arriving as source the author has to retype — which is
 * the whole reason the AI prompts ask for Markdown rather than a bespoke block schema.
 */
export const richTextFromMarkdown = (markdown: string): IRichText => {
  const content = parseBlocks(markdown ?? '');
  if (!content.length) return createEmptyRichText();
  const doc: IRichTextDoc = { type: 'doc', content };
  return { format: RichTextFormat.DOC_V1, doc, text: docToPlainText(doc) };
};
