import type { IRichTextNode } from '../interfaces/rich-text.interface';
import {
  type ActivityFence,
  CHECK_NODE,
  CHECK_OPTION_NODE,
  CHECK_PROMPT_NODE,
  CHECK_WHY_NODE,
  CONCEPT_NODE,
  FLASHCARD_BACK_NODE,
  FLASHCARD_FRONT_NODE,
  FLASHCARD_NODE,
  FLASHCARDS_NODE,
  REVEAL_ANSWER_NODE,
  REVEAL_NODE,
  REVEAL_PROMPT_NODE,
  PICTURE_LABEL_NODE,
  PICTURE_MODES,
  PICTURE_NODE,
  SAY_NODE,
  SENTENCE_NODE,
  SENTENCE_ROLES,
  SENTENCE_TILE_NODE,
  SENTENCE_VARIANT_NODE,
  SOUNDBOARD_NODE,
  SOUNDMAP_NODE,
  STEP_NODE,
  STEPS_NODE,
} from './activity.util';

/** The Markdown importer's own helpers, passed in so this module needs nothing private from it. */
export interface IActivityParsers {
  parseBlocks: (markdown: string) => IRichTextNode[];
  parseInline: (line: string) => IRichTextNode[];
  /** Flattens any block to the paragraphs it holds. */
  toParagraphs: (node: IRichTextNode) => IRichTextNode[];
  /** The attributes written on the fence's opening line (`src=… mode=find`). */
  attrs: Record<string, string>;
}

/** A picture label: `- 24,40 [बालकः]{lang=sa g=m} :: boy`, the point as % across and % down. */
const LABEL_LINE = /^[-*]\s+(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s+(.+?)(?:\s+::\s+(.+))?$/;
/** A sentence tile: `- doer [बालकः]{lang=sa g=m} :: boy`. */
const TILE_LINE = new RegExp(`^[-*]\\s+(${SENTENCE_ROLES.join('|')})\\s+(.+?)(?:\\s+::\\s+(.+))?$`);
const clampPercent = (value: string): number => Math.min(100, Math.max(0, Number(value)));

/** Inside a reveal or a check, a line of `---` separates the question from its answer or "why". */
const PART_BREAK = /^-{3,}\s*$/;
/** A check option: `- [x] right` or `- [ ] wrong`. */
const OPTION_LINE = /^[-*]\s+\[([ xX])\]\s+(.*)$/;
/** A flashcard: `- front :: back`. */
const CARD_LINE = /^[-*]\s+(.+?)\s+::\s+(.+)$/;

/** A part of a block that holds any blocks, but never nothing: an empty part gets an empty paragraph. */
const blocksOf = (markdown: string, { parseBlocks }: IActivityParsers): IRichTextNode[] => {
  const blocks = parseBlocks(markdown);
  return blocks.length ? blocks : [{ type: 'paragraph' }];
};

const splitAtBreak = (lines: string[]): [string[], string[]] => {
  const at = lines.findIndex((line) => PART_BREAK.test(line.trim()));
  return at < 0 ? [lines, []] : [lines.slice(0, at), lines.slice(at + 1)];
};

const ACTIVITY_BUILDERS: Record<ActivityFence, (body: string[], p: IActivityParsers) => IRichTextNode | null> = {
  reveal: (body, p) => {
    const [prompt, answer] = splitAtBreak(body);
    if (!answer.some((line) => line.trim())) return null;
    return {
      type: REVEAL_NODE,
      content: [
        { type: REVEAL_PROMPT_NODE, content: blocksOf(prompt.join('\n'), p) },
        { type: REVEAL_ANSWER_NODE, content: blocksOf(answer.join('\n'), p) },
      ],
    };
  },
  check: (body, p) => {
    const [main, why] = splitAtBreak(body);
    const first = main.findIndex((line) => OPTION_LINE.test(line.trim()));
    if (first < 0) return null;
    const options = main
      .slice(first)
      .map((line) => OPTION_LINE.exec(line.trim()))
      .filter((match): match is RegExpExecArray => !!match)
      .map((match) => ({
        type: CHECK_OPTION_NODE,
        attrs: { correct: match[1] !== ' ' },
        content: [{ type: 'paragraph', content: p.parseInline(match[2].trim()) }],
      }));
    if (options.length < 2) return null;
    const content: IRichTextNode[] = [
      { type: CHECK_PROMPT_NODE, content: blocksOf(main.slice(0, first).join('\n'), p) },
      ...options,
    ];
    if (why.some((line) => line.trim())) content.push({ type: CHECK_WHY_NODE, content: blocksOf(why.join('\n'), p) });
    return { type: CHECK_NODE, content };
  },
  soundboard: (body, p) => {
    const table = p.parseBlocks(body.join('\n')).find((node) => node.type === 'table');
    return table ? { type: SOUNDBOARD_NODE, content: [table] } : null;
  },
  cards: (body, p) => {
    const cards = body
      .map((line) => CARD_LINE.exec(line.trim()))
      .filter((match): match is RegExpExecArray => !!match)
      .map((match) => ({
        type: FLASHCARD_NODE,
        content: [
          { type: FLASHCARD_FRONT_NODE, content: [{ type: 'paragraph', content: p.parseInline(match[1]) }] },
          { type: FLASHCARD_BACK_NODE, content: [{ type: 'paragraph', content: p.parseInline(match[2]) }] },
        ],
      }));
    return cards.length ? { type: FLASHCARDS_NODE, content: cards } : null;
  },
  steps: (body, p) => {
    // Steps are separated by lines of `---`; each needs something on it.
    const groups: string[][] = [[]];
    body.forEach((line) => (PART_BREAK.test(line.trim()) ? groups.push([]) : groups[groups.length - 1].push(line)));
    const steps = groups
      .filter((lines) => lines.some((line) => line.trim()))
      .map((lines) => ({ type: STEP_NODE, content: blocksOf(lines.join('\n'), p) }));
    return steps.length >= 2 ? { type: STEPS_NODE, content: steps } : null;
  },
  picture: (body, p) => {
    const src = p.attrs.src ?? '';
    const labels = body
      .map((line) => LABEL_LINE.exec(line.trim()))
      .filter((match): match is RegExpExecArray => !!match)
      .map((match) => ({
        type: PICTURE_LABEL_NODE,
        attrs: { x: clampPercent(match[1]), y: clampPercent(match[2]) },
        content: [
          { type: 'paragraph', content: p.parseInline(match[3].trim()) },
          ...(match[4] ? [{ type: 'paragraph', content: p.parseInline(match[4].trim()) }] : []),
        ],
      }));
    if (!src || !labels.length) return null;
    const mode = PICTURE_MODES.find((item) => item === p.attrs.mode) ?? 'explore';
    return { type: PICTURE_NODE, attrs: { src, alt: p.attrs.alt ?? '', mode }, content: labels };
  },
  soundmap: (body, p) => {
    const table = p.parseBlocks(body.join('\n')).find((node) => node.type === 'table');
    return table ? { type: SOUNDMAP_NODE, content: [table] } : null;
  },
  sentence: (body, p) => {
    const groups: string[][] = [[]];
    body.forEach((line) => (PART_BREAK.test(line.trim()) ? groups.push([]) : groups[groups.length - 1].push(line)));
    const variants = groups
      .map((lines): IRichTextNode | null => {
        const tiles = lines
          .map((line) => TILE_LINE.exec(line.trim()))
          .filter((match): match is RegExpExecArray => !!match)
          .map((match) => ({
            type: SENTENCE_TILE_NODE,
            attrs: { role: match[1] },
            content: [
              { type: 'paragraph', content: p.parseInline(match[2].trim()) },
              ...(match[3] ? [{ type: 'paragraph', content: p.parseInline(match[3].trim()) }] : []),
            ],
          }));
        // Anything else in the group is the caption: the whole sentence and its meaning.
        const caption = lines.filter((line) => line.trim() && !TILE_LINE.test(line.trim())).join('\n');
        const captionBlocks = caption ? p.parseBlocks(caption).slice(0, 1) : [];
        return tiles.length ? { type: SENTENCE_VARIANT_NODE, content: [...tiles, ...captionBlocks] } : null;
      })
      .filter((variant): variant is IRichTextNode => !!variant);
    return variants.length ? { type: SENTENCE_NODE, content: variants } : null;
  },
  concept: (body, p) => {
    if (!body.some((line) => line.trim())) return null;
    return { type: CONCEPT_NODE, attrs: { title: p.attrs.title ?? '' }, content: blocksOf(body.join('\n'), p) };
  },
  say: (body, p) => {
    const lines = p
      .parseBlocks(body.join('\n'))
      .reduce<IRichTextNode[]>((out, node) => out.concat(p.toParagraphs(node)), []);
    return lines.length ? { type: SAY_NODE, content: lines } : null;
  },
};

/** The node a fence's body describes, or null when the body does not hold what its kind needs. */
export const activityFromMarkdown = (
  kind: ActivityFence,
  body: string[],
  parsers: IActivityParsers,
): IRichTextNode | null => ACTIVITY_BUILDERS[kind](body, parsers);
