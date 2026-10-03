import { type IAiFigure, type IRichTextNode } from '../interfaces';
import { FIGURE_REF_PREFIX, mapImageSources } from '../utils/rich-text-image.util';
import { type IAiIssue, parseJsonObject } from './common';

/** Largest SVG a reply may carry for one figure. A chart or diagram is a few kilobytes. */
export const MAX_FIGURE_BYTES = 200_000;

/** What the prompts tell a model about pictures; one block shared by the lesson and paper prompts. */
export const FIGURE_RULES = `
Pictures are welcome wherever they make an idea clearer than words: every chart a data question
is about, a geometry figure, a labelled diagram, a clock face, a number line, a Venn diagram, a
flow of steps. Draw each one yourself as SVG source in the reply's "figures" list and place it in
Markdown on its own line as ![alt text](figure:<ref> "Caption"), e.g. ![Bar chart of sales](figure:F1 "Sales, 2021–2024").
- "ref" is short and unique in the reply ("F1", "F2", …); "alt" says what the picture shows in one sentence; "caption" is optional.
- "svg" is one complete <svg> element with xmlns="http://www.w3.org/2000/svg" and a viewBox, at most 800 units wide, with width and height attributes equal to the viewBox size (the picture is shown at that size, never larger), drawn on a white rectangle that fills the viewBox so it reads in light and dark mode. A small figure, such as an answer option, is drawn small (about 120 wide).
- Draw from the exact numbers in the text: bar heights, pie angles and plotted points must be to scale, and every axis, bar, sector, side and angle the reader needs is labelled with its value.
- Text is <text> with font-family="Arial, sans-serif" and a size of at least 12; colours with strong contrast against white; no gradients needed.
- Nothing else in the SVG: no <script>, no event attributes (onclick…), no <foreignObject>, no <image>, no external links or fonts, no CSS url() except url(#id).
- A picture never replaces the data a question needs: keep the numbers in the text or a table as well, so the question can be answered without seeing the image.
- Inside JSON the SVG is one string: escape every double quote as \\" (or use single quotes for attributes) and write newlines as \\n.`;

const FIGURE_REF = /figure:([\w-]+)/g;

/** The figure refs a piece of Markdown points at, in order, repeats included. */
export const figureRefsIn = (markdown: string): string[] => {
  const refs: string[] = [];
  const pattern = new RegExp(FIGURE_REF.source, 'g');
  let match = pattern.exec(markdown ?? '');
  while (match) {
    refs.push(match[1]);
    match = pattern.exec(markdown ?? '');
  }
  return refs;
};

/** Why an SVG cannot be stored, or `null` when it is a plain drawing. */
export const svgProblem = (svg: string): string | null => {
  const text = (svg ?? '').trim();
  if (!text) return 'The SVG is empty.';
  if (text.length > MAX_FIGURE_BYTES) return `The SVG is over ${MAX_FIGURE_BYTES / 1000} kB.`;
  if (!/^(<\?xml[^>]*\?>\s*)?<svg[\s>]/i.test(text) || !/<\/svg>\s*$/i.test(text)) return 'Not a single <svg> element.';
  if (!/\bviewBox\s*=/.test(text)) return 'The SVG has no viewBox, so it cannot scale.';
  if (/<script|<foreignObject|<image[\s>]|<iframe|<object|<embed/i.test(text)) {
    return 'The SVG embeds a script or foreign content.';
  }
  if (/\son[a-z]+\s*=/i.test(text)) return 'The SVG has an event attribute.';
  if (/(?:xlink:)?href\s*=\s*["'](?!#)/i.test(text)) return 'The SVG links outside itself.';
  if (/url\(\s*["']?(?!#)/i.test(text) || /@import/i.test(text)) return 'The SVG loads an external resource.';
  return null;
};

/**
 * Checks a reply's figures against the Markdown that uses them: every ref used is defined, every
 * defined figure is a safe SVG with alt text, and refs are unique. Unused figures only warn.
 */
export const checkFigures = (figures: IAiFigure[] | undefined, markdown: string[], issues: IAiIssue[]) => {
  const list = figures ?? [];
  const defined = new Map<string, IAiFigure>();
  list.forEach((figure, index) => {
    const path = `figures[${index}]`;
    if (!figure?.ref || !/^[\w-]+$/.test(figure.ref)) {
      issues.push({ level: 'error', path, message: 'A figure needs a "ref" of letters, digits, "-" or "_".' });
      return;
    }
    if (defined.has(figure.ref)) {
      issues.push({ level: 'error', path, message: `Figure "${figure.ref}" is defined twice.` });
    }
    defined.set(figure.ref, figure);
    const problem = svgProblem(figure.svg);
    if (problem) issues.push({ level: 'error', path: `${path}.svg`, message: problem });
    if (!figure.alt?.trim()) {
      issues.push({ level: 'warning', path, message: `Figure "${figure.ref}" has no alt text.` });
    }
    if (!/<svg[^>]*\swidth\s*=/i.test(figure.svg ?? '')) {
      issues.push({
        level: 'warning',
        path,
        message: `Figure "${figure.ref}" has no width; it shows at the browser's default size.`,
      });
    }
  });
  const used = new Set(markdown.reduce<string[]>((all, item) => all.concat(figureRefsIn(item)), []));
  used.forEach((ref) => {
    if (!defined.has(ref)) {
      issues.push({ level: 'error', path: 'figures', message: `"figure:${ref}" is used but not in "figures".` });
    }
  });
  defined.forEach((_figure, ref) => {
    if (!used.has(ref)) issues.push({ level: 'warning', path: 'figures', message: `Figure "${ref}" is never placed.` });
  });
};

export interface IUploadedFigures {
  /** The reply with every `figure:<ref>` swapped for the uploaded address and `figures` removed. */
  text: string;
  uploaded: { ref: string; src: string }[];
  issues: IAiIssue[];
}

/**
 * Uploads the figures a reply defines and rewrites the reply to point at them. `upload` stores one
 * SVG and returns the address the image node keeps; the CLI and the teaching app each supply their
 * own. A reply with no figures comes back unchanged, and one whose figures fail the checks is not
 * uploaded at all, so nothing reaches the bucket for a reply that will be refused.
 */
export const uploadReplyFigures = async (
  text: string,
  upload: (figure: IAiFigure) => Promise<string>,
): Promise<IUploadedFigures> => {
  const { value: raw } = parseJsonObject(text);
  const figures = (raw?.figures ?? []) as IAiFigure[];
  if (!raw || !Array.isArray(figures) || !figures.length) return { text, uploaded: [], issues: [] };
  const issues: IAiIssue[] = [];
  checkFigures(figures, [JSON.stringify({ ...raw, figures: undefined })], issues);
  if (issues.some((issue) => issue.level === 'error')) return { text, uploaded: [], issues };
  const uploaded: { ref: string; src: string }[] = [];
  for (const figure of figures) uploaded.push({ ref: figure.ref, src: await upload(figure) });
  const srcByRef = new Map(uploaded.map((item) => [item.ref, item.src]));
  const { figures: _figures, ...rest } = raw;
  const rewritten = JSON.stringify(rest).replace(FIGURE_REF, (whole, ref: string) => srcByRef.get(ref) ?? whole);
  return { text: rewritten, uploaded, issues };
};

/** The figures a reply defines, read from its raw text; `[]` when it has none or does not parse. */
export const figuresOf = (text: string): IAiFigure[] => {
  const figures = parseJsonObject(text).value?.figures;
  return Array.isArray(figures) ? (figures as IAiFigure[]) : [];
};

const isRichText = (value: unknown): value is { doc: IRichTextNode } =>
  !!value && typeof value === 'object' && 'doc' in value && 'format' in value;

/**
 * A converted row with every `figure:<ref>` image pointed at its uploaded address: lesson content,
 * a question's body, options and solution alike, wherever a rich-text value sits in the row.
 */
export const withFigureSources = <T>(row: T, srcByRef: Map<string, string>): T => {
  if (!srcByRef.size) return row;
  const swap = (src: string) =>
    src.startsWith(FIGURE_REF_PREFIX) ? (srcByRef.get(src.slice(FIGURE_REF_PREFIX.length)) ?? src) : src;
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (isRichText(value)) return { ...value, doc: mapImageSources(value.doc, swap) };
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, walk(item)]),
      );
    }
    return value;
  };
  return walk(row) as T;
};
