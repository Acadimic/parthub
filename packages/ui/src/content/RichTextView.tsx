import type { IRichText, IRichTextMark, IRichTextNode, RichTextAttrValue } from '@repo/shared/interfaces';
import {
  CHECK_NODE,
  CHECK_OPTION_NODE,
  CHECK_PROMPT_NODE,
  CHECK_WHY_NODE,
  docToPlainText,
  FLASHCARD_BACK_NODE,
  FLASHCARD_FRONT_NODE,
  FLASHCARDS_NODE,
  REVEAL_ANSWER_NODE,
  REVEAL_NODE,
  REVEAL_PROMPT_NODE,
  PICTURE_LABEL_NODE,
  PICTURE_NODE,
  SAY_NODE,
  SENTENCE_NODE,
  SENTENCE_ROLES,
  SENTENCE_TILE_NODE,
  type SentenceRole,
  SOUNDBOARD_NODE,
  SOUNDMAP_NODE,
  type MouthPlace,
  STEPS_NODE,
  CONCEPT_NODE,
  graphAttrsOfNode,
  isSamePronunciation,
  LISTENING_NODE,
  type ListeningMode,
  PRONUNCIATION_MARK,
  pronunciationAttrsOf,
  SCENE3D_NODE,
} from '@repo/shared/utils';
import { createElement, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { spokenOf } from './activities/ActivityFrame';
import { CheckBlock } from './activities/CheckBlock';
import { FlashcardDeck } from './activities/FlashcardDeck';
import { RevealBlock } from './activities/RevealBlock';
import { PictureLabels } from './activities/PictureLabels';
import { SayItBlock } from './activities/SayItBlock';
import { ConceptBlock } from './activities/ConceptBlock';
import { SentenceBlock } from './activities/SentenceBlock';
import { SoundBoard } from './activities/SoundBoard';
import { type IManner, SoundMap } from './activities/SoundMap';
import { StepsBlock } from './activities/StepsBlock';
import { GraphButton } from './GraphButton';
import { type IDialogueBubble, ListeningBlock } from './ListeningBlock';
import { MathRender } from './MathRender';
import { PronouncedText } from './PronouncedText';
import { RichTextImage } from './RichTextImage';
import { SceneCard } from './SceneCard';

export interface IRichTextViewProps {
  value?: IRichText | null;
  /** Rendered when the value is empty. A dash reads better than a blank cell in a table. */
  fallback?: ReactNode;
  /** A bold lead-in on the first line — "Question:", "Ans:", "Solution:". */
  prefix?: ReactNode;
  className?: string;
}

const numberAttr = (attrs: Record<string, RichTextAttrValue> | undefined, key: string, fallback: number): number => {
  const value = attrs?.[key];
  return typeof value === 'number' ? value : fallback;
};

const stringAttr = (attrs: Record<string, RichTextAttrValue> | undefined, key: string): string => {
  const value = attrs?.[key];
  return typeof value === 'string' ? value : '';
};

/** A numbering cell: a number or a short Latin label, such as 1, 12., F3, (a), Q2. */
const NUMBER_LABEL = /^[(]?[A-Za-z]{0,2}[0-9]{0,3}[.)]?$/;

const NUMBER_COLUMN_CLASS =
  '[&_tr>*:first-child]:w-px [&_tr>*:first-child]:min-w-0 [&_tr>*:first-child]:whitespace-nowrap';

/**
 * True when the first column is a numbering column: a short header label over short plain labels
 * ("No." over 1, 2, 3; "F" over F1, F2). A short header over words or letters ("Row" over a run of
 * Devanagari) is not one, and squeezing it would wrap every cell to a character or two.
 */
const hasNumberColumn = (table: IRichTextNode): boolean => {
  const [header, ...rows] = table.content ?? [];
  const first = header?.content?.[0];
  if (first?.type !== 'tableHeader') return false;
  const label = docToPlainText(first).trim();
  const isLabel = (cell: IRichTextNode | undefined) => NUMBER_LABEL.test(docToPlainText(cell ?? null).trim());
  return label.length > 0 && label.length <= 4 && rows.every((row) => isLabel(row.content?.[0]));
};

/** Only these schemes may leave the page from authored content; anything else renders as text. */
const SAFE_LINK = /^(https?:|mailto:|tel:)/i;

/** Wraps a run of text in one mark. Unknown marks fall through, so text is never lost. */
const MARK_WRAPPERS: Record<string, (children: ReactNode, mark: IRichTextMark) => ReactNode> = {
  bold: (children) => <strong className="font-semibold">{children}</strong>,
  italic: (children) => <em className="italic">{children}</em>,
  strike: (children) => <s className="line-through">{children}</s>,
  underline: (children) => <u className="underline">{children}</u>,
  code: (children) => <code className="bg-muted px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
  link: (children, mark) => {
    const href = stringAttr(mark.attrs, 'href');
    // The global stylesheet resets `a` to inherit colour with no underline, so a link has to opt
    // back in here or a reader cannot tell it from the prose around it.
    if (!SAFE_LINK.test(href)) return children;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
        {children}
      </a>
    );
  },
};

const applyMarks = (text: string, marks: IRichTextMark[] | undefined): ReactNode =>
  (marks ?? []).reduce<ReactNode>((node, mark) => MARK_WRAPPERS[mark.type]?.(node, mark) ?? node, text);

const HEADING_CLASSES: Record<number, string> = {
  1: 'text-2xl font-semibold mt-6 mb-3',
  2: 'text-xl font-semibold mt-5 mb-2.5',
  3: 'text-lg font-semibold mt-4 mb-2',
};

/**
 * Renders one node and its children.
 *
 * A lookup rather than a switch so a node type is one entry, and an unrecognised type falls through
 * to its children — a document written by a newer editor degrades to readable text instead of
 * rendering blank.
 */
const NODE_RENDERERS: Record<string, (node: IRichTextNode, children: ReactNode, key: string) => ReactNode> = {
  paragraph: (_node, children, key) => (
    <p key={key} className="my-3">
      {children}
    </p>
  ),
  heading: (node, children, key) => {
    const level = Math.min(Math.max(numberAttr(node.attrs, 'level', 1), 1), 3);
    return createElement(`h${level}`, { key, className: HEADING_CLASSES[level] }, children);
  },
  bulletList: (_node, children, key) => (
    <ul key={key} className="my-3 list-disc pl-6">
      {children}
    </ul>
  ),
  orderedList: (node, children, key) => (
    <ol key={key} start={numberAttr(node.attrs, 'start', 1)} className="my-3 list-decimal pl-6">
      {children}
    </ol>
  ),
  listItem: (_node, children, key) => <li key={key}>{children}</li>,
  blockquote: (_node, children, key) => (
    <blockquote key={key} className="border-l-2 border-border pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  codeBlock: (_node, children, key) => (
    <pre key={key} className="my-3 overflow-x-auto bg-muted p-3 font-mono text-xs">
      <code>{children}</code>
    </pre>
  ),
  horizontalRule: (_node, _children, key) => <hr key={key} className="my-6 border-border" />,
  hardBreak: (_node, _children, key) => <br key={key} />,
  // A table scrolls inside its own container rather than widening the page, and its columns size
  // to their content: a fixed layout split a phone's width evenly and wrapped every cell to a few
  // characters. A cell never narrows below a readable width. `bordered: false` is a layout grid —
  // the cells keep their padding and lose their lines.
  table: (node, children, key) => (
    <div key={key} className="my-4 overflow-x-auto">
      <table
        className={cn(
          'w-full border-collapse text-sm [&_td]:min-w-[6rem] [&_th]:min-w-[6rem] [&_td]:align-top',
          // A first column headed by a short label ("No.", "#", "F") is a numbering column: it takes
          // only the width of its own text, and the rest of the row gets the space.
          hasNumberColumn(node) ? NUMBER_COLUMN_CLASS : '',
          node.attrs?.bordered === false ? '[&_td]:border-0 [&_th]:border-0' : '[&_td]:border [&_th]:border',
          '[&_td]:border-border [&_th]:border-border [&_td]:p-2 [&_th]:p-2 [&_th]:bg-muted/40 [&_th]:text-left [&_th]:font-semibold [&_td>p]:my-0 [&_th>p]:my-0',
        )}
      >
        <tbody>{children}</tbody>
      </table>
    </div>
  ),
  tableRow: (_node, children, key) => <tr key={key}>{children}</tr>,
  tableHeader: (node, children, key) => (
    <th key={key} colSpan={numberAttr(node.attrs, 'colspan', 1)} rowSpan={numberAttr(node.attrs, 'rowspan', 1)}>
      {children}
    </th>
  ),
  tableCell: (node, children, key) => (
    <td key={key} colSpan={numberAttr(node.attrs, 'colspan', 1)} rowSpan={numberAttr(node.attrs, 'rowspan', 1)}>
      {children}
    </td>
  ),
  image: (node, _children, key) => (
    <RichTextImage
      key={key}
      src={stringAttr(node.attrs, 'src')}
      alt={stringAttr(node.attrs, 'alt')}
      caption={stringAttr(node.attrs, 'caption')}
      width={stringAttr(node.attrs, 'width') || 'full'}
    />
  ),
  inlineMath: (node, _children, key) => {
    const latex = stringAttr(node.attrs, 'latex');
    const graph = graphAttrsOfNode(node.attrs);
    if (!graph) return <MathRender key={key} latex={latex} />;
    // Kept on one line, so the cube never wraps away from its equation.
    return (
      <span key={key} className="whitespace-nowrap">
        <MathRender latex={latex} />
        <GraphButton latex={latex} {...graph} className="ml-0.5" />
      </span>
    );
  },
  [LISTENING_NODE]: (node, children, key) => (
    <ListeningBlock
      key={key}
      lang={stringAttr(node.attrs, 'lang')}
      mode={(node.attrs?.mode === 'dialogue' ? 'dialogue' : 'passage') satisfies ListeningMode}
      audio={stringAttr(node.attrs, 'audio')}
      lineAudio={stringAttr(node.attrs, 'lineAudio')}
      isTranscriptHidden={node.attrs?.transcript === 'hidden'}
      lines={node.content ?? []}
      bubbles={(node.content ?? []).map((line, index) => dialogueBubbleOf(line, `${key}.b${index}`))}
    >
      {Array.isArray(children) ? children : [children]}
    </ListeningBlock>
  ),
  [SCENE3D_NODE]: (node, _children, key) => (
    <SceneCard key={key} spec={stringAttr(node.attrs, 'spec')} display="inline" />
  ),
  [REVEAL_NODE]: (node, _children, key) => (
    <RevealBlock
      key={key}
      prompt={renderPart(node, REVEAL_PROMPT_NODE, `${key}.q`)}
      answer={renderPart(node, REVEAL_ANSWER_NODE, `${key}.a`)}
    />
  ),
  [CHECK_NODE]: (node, _children, key) => {
    const options = (node.content ?? []).filter((child) => child.type === CHECK_OPTION_NODE);
    const hasWhy = (node.content ?? []).some((child) => child.type === CHECK_WHY_NODE);
    return (
      <CheckBlock
        key={key}
        prompt={renderPart(node, CHECK_PROMPT_NODE, `${key}.q`)}
        options={options.map((option, index) => {
          const spoken = spokenOf(option);
          return {
            isCorrect: option.attrs?.correct === true,
            content: renderChildren(option.content ?? [], `${key}.o${index}`),
            spoken: spoken ? { ...spoken, label: docToPlainText(option).trim() } : null,
          };
        })}
        why={hasWhy ? renderPart(node, CHECK_WHY_NODE, `${key}.w`) : null}
      />
    );
  },
  [SOUNDBOARD_NODE]: (node, _children, key) => {
    const table = (node.content ?? []).find((child) => child.type === 'table');
    const rows = (table?.content ?? []).map((row, rowIndex) =>
      (row.content ?? []).map((cell, cellIndex) => ({
        isHeader: cell.type === 'tableHeader',
        content: renderChildren(cell.content ?? [], `${key}.${rowIndex}.${cellIndex}`),
        spoken: spokenOf(cell),
      })),
    );
    return <SoundBoard key={key} rows={rows} />;
  },
  [FLASHCARDS_NODE]: (node, _children, key) => (
    <FlashcardDeck
      key={key}
      cards={(node.content ?? []).map((card, index) => {
        const front = card.content?.find((child) => child.type === FLASHCARD_FRONT_NODE);
        return {
          front: renderPart(card, FLASHCARD_FRONT_NODE, `${key}.${index}.f`),
          back: renderPart(card, FLASHCARD_BACK_NODE, `${key}.${index}.b`),
          spoken: spokenOf(front),
        };
      })}
    />
  ),
  [STEPS_NODE]: (node, _children, key) => (
    <StepsBlock
      key={key}
      steps={(node.content ?? []).map((step, index) => {
        const [first, ...rest] = step.content ?? [];
        return {
          display: first ? renderNode(first, `${key}.${index}.d`) : null,
          caption: renderChildren(rest, `${key}.${index}.c`),
        };
      })}
    />
  ),
  [PICTURE_NODE]: (node, _children, key) => (
    <PictureLabels
      key={key}
      src={stringAttr(node.attrs, 'src')}
      alt={stringAttr(node.attrs, 'alt')}
      mode={node.attrs?.mode === 'find' ? 'find' : 'explore'}
      labels={(node.content ?? [])
        .filter((label) => label.type === PICTURE_LABEL_NODE)
        .map((label, index) => {
          const [word, meaning] = label.content ?? [];
          return {
            x: numberAttr(label.attrs, 'x', 50),
            y: numberAttr(label.attrs, 'y', 50),
            word: word ? renderNode(word, `${key}.${index}.w`) : null,
            meaning: meaning ? renderNode(meaning, `${key}.${index}.m`) : null,
            meaningText: meaning ? docToPlainText(meaning).trim() : '',
            spoken: spokenOf(word),
          };
        })}
    />
  ),
  [SOUNDMAP_NODE]: (node, _children, key) => {
    const table = (node.content ?? []).find((child) => child.type === 'table');
    const [head, ...body] = table?.content ?? [];
    const cellOf = (cell: IRichTextNode, at: string) => ({
      isHeader: cell.type === 'tableHeader',
      content: renderChildren(cell.content ?? [], at),
      spoken: spokenOf(cell),
    });
    const manners = (head?.content ?? []).map((cell) => mannerOf(docToPlainText(cell)));
    return (
      <SoundMap
        key={key}
        header={(head?.content ?? []).map((cell, index) => cellOf(cell, `${key}.h${index}`))}
        rows={body.map((row, rowIndex) => {
          const [label, ...cells] = row.content ?? [];
          return {
            place: placeOf(docToPlainText(label ?? null)),
            label: cellOf(label ?? { type: 'tableCell' }, `${key}.${rowIndex}.l`),
            cells: cells.map((cell, col) => ({
              cell: cellOf(cell, `${key}.${rowIndex}.${col}`),
              manner: manners[col + 1] ?? NO_MANNER,
            })),
          };
        })}
      />
    );
  },
  [SENTENCE_NODE]: (node, _children, key) => (
    <SentenceBlock
      key={key}
      variants={(node.content ?? []).map((variant, index) => {
        const parts = variant.content ?? [];
        const caption = parts.find((part) => part.type !== SENTENCE_TILE_NODE);
        return {
          tiles: parts
            .filter((part) => part.type === SENTENCE_TILE_NODE)
            .map((tile, at) => {
              const [word, meaning] = tile.content ?? [];
              const role = SENTENCE_ROLES.find((item) => item === tile.attrs?.role) ?? 'doer';
              return {
                role: role satisfies SentenceRole,
                word: word ? renderChildren(word.content ?? [], `${key}.${index}.${at}.w`) : null,
                meaning: meaning ? renderChildren(meaning.content ?? [], `${key}.${index}.${at}.m`) : null,
                spoken: spokenOf(word),
                text: word ? docToPlainText(word).trim() : '',
              };
            }),
          caption: caption ? renderNode(caption, `${key}.${index}.c`) : null,
        };
      })}
    />
  ),
  [CONCEPT_NODE]: (node, children, key) => (
    <ConceptBlock key={key} title={stringAttr(node.attrs, 'title')}>
      {children}
    </ConceptBlock>
  ),
  [SAY_NODE]: (node, _children, key) => (
    <SayItBlock
      key={key}
      lines={(node.content ?? []).map((line, index) => ({
        content: renderNode(line, `${key}.${index}`),
        label: docToPlainText(line).trim(),
        spoken: spokenOf(line),
      }))}
    />
  ),
  blockMath: (node, _children, key) => {
    const latex = stringAttr(node.attrs, 'latex');
    const graph = graphAttrsOfNode(node.attrs);
    if (!graph) {
      return (
        <div key={key} className="my-4 overflow-x-auto">
          <MathRender latex={latex} displayMode />
        </div>
      );
    }
    return (
      <div key={key} className="my-4 flex items-center gap-2">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <MathRender latex={latex} displayMode />
        </div>
        <GraphButton latex={latex} {...graph} className="shrink-0" />
      </div>
    );
  },
};

const pronunciationOf = (node: IRichTextNode): IRichTextMark | undefined =>
  node.type === 'text' ? node.marks?.find((mark) => mark.type === PRONUNCIATION_MARK) : undefined;

/**
 * Renders a node's children. A pronounced run is often several text nodes — `**Buenos** días` is
 * two — so neighbours carrying the same pronunciation are gathered into one `PronouncedText`,
 * or the reader would see a speaker after every change of formatting.
 */
const renderChildren = (nodes: IRichTextNode[], key: string): ReactNode[] => {
  const out: ReactNode[] = [];
  let index = 0;
  while (index < nodes.length) {
    const mark = pronunciationOf(nodes[index]);
    if (!mark) {
      out.push(renderNode(nodes[index], `${key}.${index}`));
      index += 1;
      continue;
    }
    let end = index + 1;
    while (end < nodes.length) {
      const next = pronunciationOf(nodes[end]);
      if (!next || !isSamePronunciation(mark, next)) break;
      end += 1;
    }
    const run = nodes.slice(index, end);
    const start = index;
    out.push(
      <PronouncedText
        key={`${key}.${start}`}
        text={docToPlainText({ type: 'paragraph', content: run })}
        pronunciation={pronunciationAttrsOf(mark)}
      >
        {run.map((child, offset) => renderNode(child, `${key}.${start + offset}`))}
      </PronouncedText>,
    );
    index = end;
  }
  return out;
};

/** A dialogue line opens with its speaker in bold and a colon, "**Ana:**"; the bubble shows the rest. */
const dialogueBubbleOf = (line: IRichTextNode, key: string): IDialogueBubble => {
  const [first, ...rest] = line.content ?? [];
  const isLabel =
    first?.type === 'text' && first.marks?.some((mark) => mark.type === 'bold') && /:\s*$/.test(first.text ?? '');
  if (!isLabel) return { speaker: '', content: null };
  return { speaker: (first.text ?? '').replace(/:\s*$/, '').trim(), content: renderChildren(rest, key) };
};

const NO_MANNER: IManner = { isPuff: false, isBuzz: false, isNose: false };

/** A sound map column's manner, from words in its header: "puff", "buzz", "nose". */
const mannerOf = (header: string): IManner => {
  const text = header.toLowerCase();
  return {
    isPuff: /puff|aspirat/.test(text),
    isBuzz: /buzz|voiced/.test(text) && !/unvoiced/.test(text),
    isNose: /nose|nasal/.test(text),
  };
};

const PLACE_WORDS: [MouthPlace, RegExp][] = [
  ['throat', /throat|velar|kaṇṭh|kanth/],
  ['palate', /palat|tālu|talu/],
  ['roof', /roof|retroflex|mūrdh|murdh/],
  ['teeth', /teeth|tooth|dental|dant/],
  ['lips', /lip|labial|oṣṭh|osth/],
];

/** A sound map row's place in the mouth, from the words in its first cell. */
const placeOf = (label: string): MouthPlace | null =>
  PLACE_WORDS.find(([, words]) => words.test(label.toLowerCase()))?.[0] ?? null;

/** The rendered content of one named part of a block (a check's prompt, a reveal's answer). */
const renderPart = (node: IRichTextNode, part: string, key: string): ReactNode[] =>
  renderChildren(node.content?.find((child) => child.type === part)?.content ?? [], key);

const renderNode = (node: IRichTextNode, key: string): ReactNode => {
  if (node.type === 'text') return <span key={key}>{applyMarks(node.text ?? '', node.marks)}</span>;

  const children = renderChildren(node.content ?? [], key);
  const render = NODE_RENDERERS[node.type];
  return render ? render(node, children, key) : <span key={key}>{children}</span>;
};

/**
 * The reading view of authored content — what a student sees.
 *
 * Walks the stored ProseMirror document and builds React elements from it. Nothing is ever passed
 * to `dangerouslySetInnerHTML`, which is the substantive difference from the `Html` component this
 * replaces: stored content cannot inject markup, because it is never treated as markup. Pairs with
 * `RichTextEditor` in `@repo/ui/editor`; this side depends on KaTeX alone.
 */
export const RichTextView = ({ value, fallback = null, prefix, className }: IRichTextViewProps) => {
  const nodes = value?.doc?.content ?? [];
  if (!nodes.length && !prefix) return <>{fallback}</>;

  const body = nodes.length ? renderChildren(nodes, 'root') : fallback;
  if (!prefix) return <div className={cn('text-sm leading-7 text-foreground', className)}>{body}</div>;

  // The prefix sits beside the content rather than inside it, so a multi-paragraph value stays
  // aligned under its own label instead of wrapping back under the lead-in.
  return (
    <div className={cn('flex gap-2 text-sm leading-7 text-foreground', className)}>
      <span className="shrink-0 font-bold">{prefix}</span>
      <div className="min-w-0 flex-1">{body}</div>
    </div>
  );
};
