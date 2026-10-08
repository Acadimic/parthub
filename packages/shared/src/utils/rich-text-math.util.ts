// Splitting a line of Markdown into prose and equations, for the importer in rich-text.util.ts.
import { normaliseLatex } from './latex-repair.util';

/** One piece of a line: prose, or an equation with its display flag. */
export interface IInlinePiece {
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
