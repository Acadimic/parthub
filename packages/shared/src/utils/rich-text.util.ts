import { RichTextFormat } from '../enums/rich-text.enum';
import type { IRichText, IRichTextDoc, IRichTextMark, IRichTextNode } from '../interfaces/rich-text.interface';
import { normaliseLatex, repairLatexControlEscapes } from './latex-repair.util';
import { repairQuoteLists } from './quote-list.util';
import { imageNode } from './rich-text-image.util';
import { createEmptyRichText, docToPlainText, INLINE_CONTAINERS } from './rich-text-plain.util';
import {
  LISTENING_MODES,
  LISTENING_NODE,
  type ListeningMode,
  parseMarkdownAttrs,
  PRONUNCIATION_MARK,
  pronunciationMarkFrom,
} from './pronunciation.util';

export { createEmptyRichText, docToPlainText, isRichTextEmpty } from './rich-text-plain.util';

/** `Array.prototype.flatMap` is past this package's compile target, so the same thing by hand. */
const flatMap = <T, U>(items: T[], map: (item: T) => U[]): U[] =>
  items.reduce<U[]>((out, item) => out.concat(map(item)), []);

// ---------------------------------------------------------------------------
// Markdown → document. The inverse of `docToMarkdown` in @repo/ui/editor, and the AI/import write path.
// ---------------------------------------------------------------------------

/** One piece of a line: prose, or an equation with its display flag. */
interface IInlinePiece {
  kind: 'text' | 'math';
  value: string;
  display?: boolean;
}

/**
 * Where an equation opened at `start` closes, or -1.
 *
 * `$…$` follows Pandoc's rule so a price is never read as an equation: the opening `$` must be
 * followed by a non-space, and the closing `$` must follow a non-space and not precede a digit.
 * "costs $5000 at 8% and returns $800" therefore has no equation in it, while "$x = 5$" does.
 */
const findMathClose = (line: string, start: number, close: string, isDollar: boolean): number => {
  let index = start;
  while (index < line.length) {
    const at = line.indexOf(close, index);
    if (at < 0) return -1;
    const isEscaped = line[at - 1] === '\\';
    const followsSpace = isBlank(line[at - 1] ?? ' ');
    const precedesDigit = /\d/.test(line[at + close.length] ?? '');
    if (!isEscaped && (!isDollar || (!followsSpace && !precedesDigit))) return at;
    index = at + close.length;
  }
  return -1;
};

/** A space, not any whitespace: a control character here is a lost backslash, which `normaliseLatex` restores. */
const isBlank = (char: string): boolean => char === ' ' || char === '\u00a0';

interface IOpener {
  open: string;
  close: string;
  display: boolean;
  isDollar: boolean;
}

/** Longest first, so `$$` is tried before `$`. `\(`, `\[` are what a model writes when not told otherwise. */
const OPENERS: IOpener[] = [
  { open: '$$', close: '$$', display: true, isDollar: false },
  { open: '\\[', close: '\\]', display: true, isDollar: false },
  { open: '\\(', close: '\\)', display: false, isDollar: false },
  { open: '$', close: '$', display: false, isDollar: true },
];

/** The equation opening at `index`, if one does: its body and where the line resumes. */
const matchMathAt = (line: string, index: number): { opener: IOpener; body: string; next: number } | null => {
  const opener = OPENERS.find((candidate) => line.startsWith(candidate.open, index));
  if (!opener) return null;
  const bodyStart = index + opener.open.length;
  const first = line[bodyStart];
  if (opener.isDollar && (first === undefined || isBlank(first))) return null;
  const end = findMathClose(line, bodyStart, opener.close, opener.isDollar);
  // Not trimmed here: a leading control character is a lost backslash `normaliseLatex` restores.
  const body = end > bodyStart ? line.slice(bodyStart, end) : '';
  return body.trim() ? { opener, body, next: end + opener.close.length } : null;
};

/** Splits a line into prose and equations. `\$` stays prose. */
export const splitInlineMath = (line: string): IInlinePiece[] => {
  const pieces: IInlinePiece[] = [];
  let text = '';
  let index = 0;
  while (index < line.length) {
    if (line[index] === '\\' && line[index + 1] === '$') {
      text += '\\$';
      index += 2;
      continue;
    }
    const math = matchMathAt(line, index);
    if (!math) {
      text += line[index];
      index += 1;
      continue;
    }
    if (text) pieces.push({ kind: 'text', value: text });
    text = '';
    pieces.push({ kind: 'math', value: normaliseLatex(math.body), display: math.opener.display });
    index = math.next;
  }
  if (text) pieces.push({ kind: 'text', value: text });
  return pieces;
};

/** `[text](https://…)`; the label is group 1 and the address group 2, so the mark carries `href`. */
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/;

/** Pandoc's bracketed span, `[Hola]{lang=es-ES ipa="ˈola"}`; without a `lang` it is not one. */
const SPAN_PATTERN = /\[([^\]]+)\]\{(?=[^}]*\blang=)([^}]*)\}/;

/** Applied in this order so the earliest match wins consistently. `code` never nests. */
const MARK_PATTERNS: { re: RegExp; type: string; literal?: boolean }[] = [
  { re: /`([^`]+)`/, type: 'code', literal: true },
  { re: LINK_PATTERN, type: 'link' },
  { re: SPAN_PATTERN, type: PRONUNCIATION_MARK },
  // `***x***` is bold around italic: the bold takes the outer pair, the italic rule the inner one.
  { re: /\*\*(\*[^*]+\*)\*\*/, type: 'bold' },
  // Bold may hold italic: `**Treating *along with* like *and*.**`.
  { re: /\*\*((?:[^*]|\*(?!\*))+?)\*\*/, type: 'bold' },
  { re: /~~([^~]+)~~/, type: 'strike' },
  // `*italic*`, as most writers and models spell it. It opens only where a star hugs the next
  // character and does not follow a word, so `a*b` and `2 * 3` inside an equation stay what they
  // are; it may be followed by a letter (`*the*s`). Tried before `_italic_`, so a blank written as
  // `____` inside it stays a blank.
  { re: /(?<![\w*\\$])\*(?![\s*])((?:[^*\n]|\*\*[^*\n]+?\*\*)+?)(?<![\s\\])\*(?!\*)/, type: 'italic' },
  // An underscore next to another underscore is a blank (`me ___ Ravi`), never the edge of an italic.
  { re: /(?<![A-Za-z0-9_])_([^_]+)_(?![A-Za-z0-9_])/, type: 'italic' },
];

const unescape = (text: string): string => text.replace(/\\\$/g, '$');

const textNode = (text: string, marks: IRichTextMark[]): IRichTextNode =>
  marks.length ? { type: 'text', text, marks } : { type: 'text', text };

/** A link carries the address it points at, a span its language and pronunciation. */
const markFrom = (type: string, match: RegExpExecArray): IRichTextMark => {
  if (type === 'link') return { type, attrs: { href: match[2] } };
  if (type === PRONUNCIATION_MARK) return pronunciationMarkFrom(parseMarkdownAttrs(match[2]));
  return { type };
};

/** Parses marks, recursing into what a mark wraps so `**_x_**` keeps both. Text stays escaped. */
const parseMarked = (input: string, marks: IRichTextMark[]): IRichTextNode[] => {
  if (!input) return [];
  // The mark that opens first wins, whichever kind it is, so marks nest either way round:
  // bold around italic and italic around bold. On a tie the pattern listed first wins.
  const found = MARK_PATTERNS.map((pattern) => ({ pattern, match: pattern.re.exec(input) }))
    .filter((item): item is { pattern: (typeof MARK_PATTERNS)[number]; match: RegExpExecArray } => !!item.match)
    .sort((a, b) => a.match.index - b.match.index)[0];
  if (found) {
    const {
      pattern: { type, literal },
      match,
    } = found;
    const inner = match[1];
    const nextMarks = [...marks, markFrom(type, match)];
    return [
      ...parseMarked(input.slice(0, match.index), marks),
      // Markdown interprets nothing inside a code span, so its content is taken verbatim.
      ...(literal ? [textNode(inner, nextMarks)] : parseMarked(inner, nextMarks)),
      ...parseMarked(input.slice(match.index + match[0].length), marks),
    ];
  }
  return [textNode(input, marks)];
};

/** A marked text node's equations become nodes; the prose around them keeps the marks. */
const splitMathInNode = (node: IRichTextNode): IRichTextNode[] => {
  // Nothing inside a code span is an equation.
  if (node.marks?.some((mark) => mark.type === 'code')) return [{ ...node, text: unescape(node.text ?? '') }];
  return splitInlineMath(node.text ?? '').map((piece): IRichTextNode =>
    piece.kind === 'math'
      ? { type: 'inlineMath', attrs: { latex: piece.value } }
      : { ...node, text: unescape(repairLatexControlEscapes(piece.value)) },
  );
};

/**
 * Splits a line into marked text and equation nodes.
 *
 * Marks first, then equations inside each run of text: `**Answer: $x$ and $y$**` is one bold
 * span with two equations in it, which the other order — equations first, marks per fragment —
 * could never see, leaving literal asterisks either side. Escapes such as `\$` are resolved last,
 * so an escaped dollar is never mistaken for a delimiter.
 */
const parseInline = (line: string): IRichTextNode[] => flatMap(parseMarked(line, []), splitMathInNode);

const listItem = (line: string): IRichTextNode => ({
  type: 'listItem',
  content: [{ type: 'paragraph', content: parseInline(line) }],
});

const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^[-*+]\s+(.*)$/;
const ORDERED = /^\d+[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const RULE = /^(-{3,}|\*{3,}|_{3,})$/;
const DISPLAY_MATH = /^(?:\$\$(.+)\$\$|\\\[(.+)\\\])$/;
/** A `$$` or `\[` alone (or starting) a line opens a block that closes on a line ending `$$` or `\]`. */
const DISPLAY_OPEN = /^(\$\$|\\\[)(.*)$/;
const DISPLAY_CLOSE = /^(.*?)(\$\$|\\\])$/;
const FENCE = /^```/;
/** `![alt](src "caption")` alone on its line. The caption is optional and may escape a quote. */
const IMAGE_LINE = /^!\[([^\]]*)\]\(\s*(\S+?)(?:\s+"((?:[^"\\]|\\.)*)")?\s*\)$/;
/** An address we may show, or a figure placeholder; anything else stays a paragraph of text. */
const IMAGE_SOURCE = /^(https:\/\/\S+|figure:[\w-]+)$/;

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
  const line = lines[index].trim();
  const single = DISPLAY_MATH.exec(line);
  if (single) {
    return {
      node: { type: 'blockMath', attrs: { latex: normaliseLatex(single[1] ?? single[2] ?? '') } },
      next: index + 1,
    };
  }
  const open = DISPLAY_OPEN.exec(line);
  if (!open) return null;
  // A block: everything up to the line that closes it, joined with spaces since LaTeX ignores them.
  const body = [open[2]];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const close = DISPLAY_CLOSE.exec(lines[cursor].trim());
    if (close) {
      body.push(close[1]);
      return { node: { type: 'blockMath', attrs: { latex: normaliseLatex(body.join(' ')) } }, next: cursor + 1 };
    }
    body.push(lines[cursor].trim());
  }
  return null;
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
    // A numbered list that resumes after a block ("7." after a table) keeps its number.
    const start = type === 'orderedList' ? Number(/^\d+/.exec(lines[index].trim())?.[0] ?? 1) : 1;
    return { node: start > 1 ? { type, attrs: { start }, content: items } : { type, content: items }, next: cursor };
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
  // A quoted list keeps its items; quoted prose is one paragraph, as a wrapped quote reads.
  const isList = quoted.some((line) => BULLET.test(line.trim()) || ORDERED.test(line.trim()));
  const content = isList
    ? parseBlocks(quoted.join('\n'))
    : [{ type: 'paragraph', content: parseInline(quoted.join(' ')) }];
  return { node: { type: 'blockquote', content }, next: cursor };
};

const TABLE_ROW = /^\|(.*)\|\s*$/;
const TABLE_SEPARATOR = /^\|(\s*:?-{3,}:?\s*\|)+\s*$/;

/** Splits a pipe row into cells, honouring `\|` as a literal pipe inside a cell. */
const splitTableRow = (line: string): string[] =>
  (TABLE_ROW.exec(line.trim())?.[1] ?? '').split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|').trim());

/** `<br>` inside a cell is a line break, the one way GFM has to break a line within a cell. */
const CELL_BREAK = /<br\s*\/?>/i;

const tableCell = (type: 'tableHeader' | 'tableCell', text: string): IRichTextNode => ({
  type,
  content: [
    {
      type: 'paragraph',
      content: text
        .split(CELL_BREAK)
        .reduce<IRichTextNode[]>(
          (nodes, line, index) => nodes.concat(index ? [{ type: 'hardBreak' }] : [], parseInline(line.trim())),
          [],
        ),
    },
  ],
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

const readImage: BlockReader = (lines, index) => {
  const match = IMAGE_LINE.exec(lines[index].trim());
  if (!match || !IMAGE_SOURCE.test(match[2])) return null;
  const caption = (match[3] ?? '').replace(/\\"/g, '"');
  return { node: imageNode(match[2], match[1].trim(), caption.trim()), next: index + 1 };
};

/** `::: listening lang=es-ES mode=dialogue` opens a listening block; a line of `:::` closes it. */
const LISTENING_OPEN = /^:::\s*listening\b(.*)$/;
const DIV_CLOSE = /^:::\s*$/;

/** A listening block holds paragraphs only; anything else inside one is flattened to its text. */
const toParagraphs = (node: IRichTextNode): IRichTextNode[] => {
  if (node.type === 'paragraph') return [node];
  if (node.type === 'heading') return [{ type: 'paragraph', content: node.content }];
  if (node.content) return flatMap(node.content, toParagraphs);
  const text = docToPlainText(node);
  return text ? [{ type: 'paragraph', content: [{ type: 'text', text }] }] : [];
};

const readListening: BlockReader = (lines, index) => {
  const open = LISTENING_OPEN.exec(lines[index].trim());
  if (!open) return null;
  let close = index + 1;
  while (close < lines.length && !DIV_CLOSE.test(lines[close].trim())) close += 1;
  if (close >= lines.length) return null;
  const paragraphs = flatMap(parseBlocks(lines.slice(index + 1, close).join('\n')), toParagraphs);
  if (!paragraphs.length) return null;
  const attrs = parseMarkdownAttrs(open[1]);
  const mode: ListeningMode = LISTENING_MODES.find((item) => item === attrs.mode) ?? 'passage';
  const transcript = attrs.transcript === 'hidden' ? 'hidden' : 'shown';
  return {
    node: { type: LISTENING_NODE, attrs: { lang: attrs.lang ?? '', mode, transcript, audio: '' }, content: paragraphs },
    next: close + 1,
  };
};

/** Order matters: a fence swallows its body, so it is tried before anything inside it can match. */
const BLOCK_READERS: BlockReader[] = [
  readFence,
  readListening,
  readImage,
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

// ---------------------------------------------------------------------------
// Repairing stored documents whose equations arrived broken.
// ---------------------------------------------------------------------------

/** A run with a command in it is an equation whatever else it holds, `\\text{ and }` included. */
const COMMAND_RUN = /\\[a-zA-Z]+/;
/** A superscript or subscript makes a run an equation only when it does not read as words. */
const SCRIPT_RUN = /\^|_\{/;
const TWO_WORDS = /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/;
const THREE_WORDS = /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/;

/** Whether a parenthesised run is an equation that lost its `\\(` and `\\)`. */
const isBareMath = (inner: string): boolean => {
  const outsideText = inner.replace(/\\text\{[^}]*\}/g, '');
  if (COMMAND_RUN.test(inner)) return !THREE_WORDS.test(outsideText);
  if (SCRIPT_RUN.test(inner)) return !TWO_WORDS.test(inner);
  // `(8x=64)`, `(A=$5000+$800=$5800)`: a relation with nothing wordier than a variable name in it.
  return /[=<>]/.test(inner) && !/[a-zA-Z]{4,}/.test(inner) && !TWO_WORDS.test(inner) && inner.length <= 80;
};

/**
 * Parenthesised equations whose `\(` and `\)` lost their backslashes: `(7+5\times2=17)`.
 *
 * The run must contain a command, a superscript or a subscript, and must not read as prose. One
 * level of inner parentheses is allowed, for `(V=\pi(4)^2(5))`.
 */
const splitBareParenMath = (text: string): IInlinePiece[] => {
  const pieces: IInlinePiece[] = [];
  let plain = '';
  let index = 0;
  while (index < text.length) {
    if (text[index] !== '(') {
      plain += text[index];
      index += 1;
      continue;
    }
    let depth = 0;
    let end = -1;
    for (let cursor = index; cursor < text.length; cursor += 1) {
      if (text[cursor] === '(') depth += 1;
      if (text[cursor] === ')') depth -= 1;
      if (depth === 0) {
        end = cursor;
        break;
      }
    }
    const inner = end > index ? text.slice(index + 1, end) : '';
    if (inner && isBareMath(inner)) {
      if (plain) pieces.push({ kind: 'text', value: plain });
      plain = '';
      pieces.push({ kind: 'math', value: normaliseLatex(inner) });
      index = end + 1;
      continue;
    }
    plain += text[index];
    index += 1;
  }
  if (plain) pieces.push({ kind: 'text', value: plain });
  return pieces;
};

/** Words with spaces between them, three or more: prose, not an equation. */
const PROSE_LATEX = /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/;

/**
 * An equation node that is really prose — "5000 at 8\\% per year for 2 years." — swallowed when a
 * price's `$` was read as a delimiter. It becomes text again; escaped `%` and `$` return to plain.
 */
const proseFromMath = (node: IRichTextNode): IRichTextNode | null => {
  const latex = String(node.attrs?.latex ?? '');
  const withoutEscapes = latex.replace(/\\[%$]/g, '');
  if (/\\[a-zA-Z]+|[\^_{}]/.test(withoutEscapes) || !PROSE_LATEX.test(withoutEscapes)) return null;
  return { type: 'text', text: latex.replace(/\\([%$])/g, '$1') };
};

/**
 * Bold that a stored paragraph shows as literal `**`, because the import split the marked run
 * around an equation. Toggled through the container's children in order, an even count at a time.
 */
const applySplitBold = (children: IRichTextNode[]): { children: IRichTextNode[]; changed: boolean } => {
  const markers = children.reduce(
    (sum, child) => sum + (child.type === 'text' ? (child.text?.split('**').length ?? 1) - 1 : 0),
    0,
  );
  if (!markers || markers % 2 === 1) return { children, changed: false };
  let isBold = false;
  const out: IRichTextNode[] = [];
  const withBold = (child: IRichTextNode, part: string): IRichTextNode => {
    const others = (child.marks ?? []).filter((mark) => mark.type !== 'bold');
    return textNode(part, isBold ? [...others, { type: 'bold' }] : others);
  };
  children.forEach((child) => {
    if (child.type !== 'text') {
      out.push(child);
      return;
    }
    // Every part between markers, in this node and the ones after it, carries the current state.
    (child.text ?? '').split('**').forEach((part, index) => {
      if (index > 0) isBold = !isBold;
      if (part) out.push(withBold(child, part));
    });
  });
  return { children: out, changed: true };
};

/** A text node's replacement: equations it was hiding become nodes; its marks stay on the prose. */
const repairTextNode = (node: IRichTextNode): IRichTextNode[] => {
  const text = repairLatexControlEscapes(node.text ?? '');
  const pieces = flatMap(splitInlineMath(text), (piece): IInlinePiece[] =>
    piece.kind === 'math' ? [piece] : splitBareParenMath(piece.value),
  );
  return pieces.map((piece): IRichTextNode =>
    piece.kind === 'math' ? { type: 'inlineMath', attrs: { latex: piece.value } } : { ...node, text: piece.value },
  );
};

const isSameDoc = (before: IRichTextNode, after: IRichTextNode) => JSON.stringify(before) === JSON.stringify(after);

/**
 * Repairs a stored document in place of the author having to retype its equations.
 *
 * Three things go wrong on import from a model reply, and each is undone here: control characters
 * where a command's backslash was eaten (`<FF>rac` → `\frac`), a bare `%` inside an equation, and
 * equations left in prose because their delimiters were lost. Returns how many nodes changed.
 */
const unescapedDollars = (text: string): number =>
  (text.replace(/\\\$/g, '').replace(/\$\$/g, '').match(/\$/g) ?? []).length;

const lastText = (node: IRichTextNode): IRichTextNode | undefined => {
  const last = node.content?.[node.content.length - 1];
  return last?.type === 'text' ? last : undefined;
};
const firstText = (node: IRichTextNode): IRichTextNode | undefined => {
  const first = node.content?.[0];
  return first?.type === 'text' ? first : undefined;
};

/**
 * Re-joins a paragraph that a `\\n` inside an equation split in two.
 *
 * `$b\\ne0$` in a JSON reply is a newline followed by "e0$", so the importer saw a paragraph
 * ending "where $b" and another starting "e0$.". Joining the two with the newline that was there
 * puts the control character back exactly where `repairLatexControlEscapes` expects it.
 */
/** The two paragraphs' joining text nodes when they are the halves of one split equation, else null. */
const splitMathSeam = (previous: IRichTextNode | undefined, block: IRichTextNode) => {
  if (previous?.type !== 'paragraph' || block.type !== 'paragraph') return null;
  const tail = lastText(previous);
  const head = firstText(block);
  if (!tail || !head) return null;
  const opensMath = unescapedDollars(tail.text ?? '') % 2 === 1;
  const closesMath = /^[a-zA-Z]+[^$\s]{0,30}\$/.test(head.text ?? '');
  return opensMath && closesMath ? { tail, head } : null;
};

const mergeSplitMathParagraphs = (blocks: IRichTextNode[]): { blocks: IRichTextNode[]; merges: number } => {
  const out: IRichTextNode[] = [];
  let merges = 0;
  blocks.forEach((block) => {
    const previous = out[out.length - 1];
    const seam = splitMathSeam(previous, block);
    if (!seam) {
      out.push(block);
      return;
    }
    const joined: IRichTextNode = { ...seam.tail, text: `${seam.tail.text}\n${seam.head.text}` };
    out[out.length - 1] = {
      ...previous,
      content: [...(previous.content ?? []).slice(0, -1), joined, ...(block.content ?? []).slice(1)],
    };
    merges += 1;
  });
  return { blocks: out, merges };
};

/** One node's repaired replacement and how many repairs it took; leaves are handled here, containers by the caller. */
const repairLeaf = (node: IRichTextNode): { nodes: IRichTextNode[]; repairs: number } => {
  if (node.type === 'inlineMath' || node.type === 'blockMath') {
    const prose = proseFromMath(node);
    if (prose) return { nodes: [prose], repairs: 1 };
    const latex = normaliseLatex(String(node.attrs?.latex ?? ''));
    return { nodes: [{ ...node, attrs: { ...node.attrs, latex } }], repairs: latex === node.attrs?.latex ? 0 : 1 };
  }
  // Code spans are literal; nothing in them is an equation.
  if (node.marks?.some((mark) => mark.type === 'code')) return { nodes: [node], repairs: 0 };
  const replaced = repairTextNode(node);
  const isChanged = replaced.length !== 1 || !isSameDoc(replaced[0], node);
  return { nodes: replaced, repairs: isChanged ? 1 : 0 };
};

export const repairRichText = (value: IRichText): { value: IRichText; repairs: number } => {
  let repairs = 0;
  const walk = (node: IRichTextNode): IRichTextNode[] => {
    if (!node.content) {
      const leaf = repairLeaf(node);
      repairs += leaf.repairs;
      return leaf.nodes;
    }
    const content = flatMap(node.content, walk);
    if (!INLINE_CONTAINERS.has(node.type)) return [{ ...node, content }];
    const bold = applySplitBold(content);
    if (bold.changed) repairs += 1;
    return [{ ...node, content: bold.children }];
  };
  const merged = mergeSplitMathParagraphs(value.doc.content ?? []);
  repairs += merged.merges;
  const lists = repairQuoteLists(merged.blocks);
  repairs += lists.repairs;
  const doc: IRichTextDoc = { ...value.doc, content: flatMap(lists.blocks, walk) };
  return { value: { ...value, doc, text: docToPlainText(doc) }, repairs };
};
