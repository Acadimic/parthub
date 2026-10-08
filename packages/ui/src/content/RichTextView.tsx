import type { IRichText, IRichTextMark, IRichTextNode, RichTextAttrValue } from '@repo/shared/interfaces';
import {
  docToPlainText,
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
import { GraphButton } from './GraphButton';
import { ListeningBlock } from './ListeningBlock';
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
    >
      {Array.isArray(children) ? children : [children]}
    </ListeningBlock>
  ),
  [SCENE3D_NODE]: (node, _children, key) => <SceneCard key={key} spec={stringAttr(node.attrs, 'spec')} />,
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
