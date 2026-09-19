import { repairJsonEscapes } from '@repo/shared/utils';

/** One thing wrong with a model's reply, pointed at with the file's own refs so a teacher can find it. */
export interface IAiIssue {
  level: 'error' | 'warning';
  /** Where in the file, e.g. "S1-Q3.options" or "M2.resources[1]". */
  path: string;
  message: string;
}

export const hasErrors = (issues: IAiIssue[]): boolean => issues.some((issue) => issue.level === 'error');

/** Finds the JSON object in a reply that may carry a code fence or a sentence around it. */
export const extractJson = (text: string): string => {
  const unfenced = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  return start >= 0 && end > start ? unfenced.slice(start, end + 1) : unfenced;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export interface IParsedJson {
  value: Record<string, unknown> | null;
  issue: IAiIssue | null;
  /** How many single-backslash escapes were repaired before parsing; a warning when non-zero. */
  repairs: number;
}

/**
 * Parses a reply into an object, or explains why it could not.
 *
 * The reply's string escapes are repaired first (`repairJsonEscapes`): a model that writes `\frac`
 * with one backslash has written an invalid or wrong JSON escape, and without the repair the
 * equation arrives as a control character or the whole reply fails to parse.
 */
export const parseJsonObject = (text: string): IParsedJson => {
  if (!text.trim()) {
    return {
      value: null,
      issue: { level: 'error', path: 'file', message: 'Paste the JSON the model returned.' },
      repairs: 0,
    };
  }
  const repaired = repairJsonEscapes(extractJson(text));
  let raw: unknown;
  try {
    raw = JSON.parse(repaired.text);
  } catch (error) {
    return {
      value: null,
      issue: {
        level: 'error',
        path: 'file',
        message: `Not valid JSON: ${error instanceof Error ? error.message : 'unknown error'}. Ask the model to return the JSON only, with every backslash doubled.`,
      },
      repairs: repaired.repairs,
    };
  }
  if (!isRecord(raw)) {
    return {
      value: null,
      issue: { level: 'error', path: 'file', message: 'The file should be one JSON object.' },
      repairs: repaired.repairs,
    };
  }
  return { value: raw, issue: null, repairs: repaired.repairs };
};

/** The warning a repaired reply carries, so the teacher knows to glance at the equations. */
export const repairIssue = (repairs: number): IAiIssue[] =>
  repairs
    ? [
        {
          level: 'warning',
          path: 'file',
          message: `${repairs} single-backslash ${repairs === 1 ? 'escape was' : 'escapes were'} repaired (the model wrote \\frac where \\\\frac was needed). Check the equations in the preview.`,
        },
      ]
    : [];

/** A price written as `$5000` in prose: it reads as an equation delimiter unless escaped. */
const CURRENCY = /(^|[^\\$])\$\d[\d,]*(\.\d+)?(?=\s|$|[.,;:)])/m;

/**
 * The equation problems a validator can see in Markdown: control characters where a command was,
 * a bare `$` price, an odd number of `$` delimiters, the wrong delimiters. Warnings, because the
 * parser repairs what it can; they tell the teacher where to look.
 */
export const checkMarkdownMath = (markdown: string, path: string, issues: IAiIssue[]) => {
  const text = markdown ?? '';
  if (/[\f\b\r]|\t(?=[a-zA-Z])/.test(text)) {
    issues.push({
      level: 'warning',
      path,
      message: 'Contains control characters where LaTeX commands were expected; repaired where the command is known.',
    });
  }
  const hasCurrency = CURRENCY.test(text);
  if (hasCurrency) {
    issues.push({
      level: 'warning',
      path,
      message: 'Uses $ as a currency sign; kept as text, but write \\$ to be safe.',
    });
  }
  const dollars = (text.replace(/\\\$/g, '').replace(/\$\$/g, '').match(/\$/g) ?? []).length;
  if (dollars % 2 === 1 && !hasCurrency) {
    issues.push({
      level: 'warning',
      path,
      message: 'An odd number of $ signs; an equation may be missing its closing $.',
    });
  }
  if (/\\\(|\\\[/.test(text)) {
    issues.push({
      level: 'warning',
      path,
      message: 'Uses \\( \\) or \\[ \\] delimiters; imported, but $ … $ was asked for.',
    });
  }
};

/** The Markdown subset the editor stores, stated for the model. Shared by every AI prompt. */
export const MARKDOWN_RULES = `
- Headings with #, ## or ### only (never deeper). Paragraphs separated by a blank line.
- **bold**, _italic_, ~~strike~~, \`code\`; links as [text](https://…).
- Bullet lists with "- ", ordered lists with "1. ", blockquotes with "> ", fenced code with triple backticks, rules with ---.
- Inline maths as $...$ and display maths on its own line as $$...$$, in LaTeX — never \\( \\) or \\[ \\]. Chemistry with \\ce{...} inside maths, e.g. $\\ce{H2SO4}$.
- Inside maths a percent sign is \\%, e.g. $20\\%$; units go in \\text{}, e.g. $60\\ \\text{km h}^{-1}$.
- Money is never a bare dollar sign: write \\$5000 in prose, or use ₹ or "Rs". A bare $ before a number would be read as the start of an equation.
- Tables as GitHub pipe tables where a comparison genuinely needs one.
- No HTML, images or footnotes, and no references to "the figure": there are no figures.
- Inside JSON strings every backslash is doubled: "\\\\frac{1}{2}" for \\frac{1}{2}, "\\\\times" for \\times, "\\\\$" for \\$; newlines are \\n. A single backslash before f, t, n, b or r is a JSON control character, not a command — "\\frac" arrives as a form feed followed by "rac".`;
