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

/** Parses a reply into an object, or explains why it could not. */
export const parseJsonObject = (text: string): { value: Record<string, unknown> | null; issue: IAiIssue | null } => {
  if (!text.trim()) {
    return { value: null, issue: { level: 'error', path: 'file', message: 'Paste the JSON the model returned.' } };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(extractJson(text));
  } catch (error) {
    return {
      value: null,
      issue: {
        level: 'error',
        path: 'file',
        message: `Not valid JSON: ${error instanceof Error ? error.message : 'unknown error'}. Ask the model to return the JSON only, with every backslash doubled.`,
      },
    };
  }
  if (!isRecord(raw)) {
    return { value: null, issue: { level: 'error', path: 'file', message: 'The file should be one JSON object.' } };
  }
  return { value: raw, issue: null };
};

/** The Markdown subset the editor stores, stated for the model. Shared by every AI prompt. */
export const MARKDOWN_RULES = `
- Headings with #, ## or ### only (never deeper). Paragraphs separated by a blank line.
- **bold**, _italic_, ~~strike~~, \`code\`; links as [text](https://…).
- Bullet lists with "- ", ordered lists with "1. ", blockquotes with "> ", fenced code with triple backticks, rules with ---.
- Inline maths as $...$ and display maths on its own line as $$...$$, in LaTeX. Chemistry with \\ce{...} inside maths, e.g. $\\ce{H2SO4}$.
- Tables as GitHub pipe tables where a comparison genuinely needs one.
- No HTML, images or footnotes, and no references to "the figure": there are no figures.
- A literal dollar sign in prose is written \\$.
- Inside JSON strings every backslash is doubled: write "\\\\frac{1}{2}" for \\frac{1}{2}, and newlines as \\n.`;
