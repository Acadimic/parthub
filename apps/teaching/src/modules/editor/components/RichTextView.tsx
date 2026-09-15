import { MathRender } from '@repo/ui/core';
import { Fragment, type ReactNode } from 'react';
import type { IDocNode } from '../lib/types';

/**
 * Renders a stored document without ProseMirror.
 *
 * This is the read path, and keeping it free of the editor is the point rather than an
 * optimisation: `apps/learning` renders every question and every study material, and a student
 * should never download a block editor to read one. It is also what gives the reading view a far
 * wider browser floor than the editor — no custom elements, no `contenteditable`.
 *
 * It intentionally reads the same document the editor writes, so what an author sees while editing
 * and what a student sees differ only in chrome.
 */

const MARK_ELEMENTS: Record<string, keyof React.JSX.IntrinsicElements> = {
  bold: 'strong',
  italic: 'em',
  strike: 's',
  underline: 'u',
  code: 'code',
};

const renderText = (node: IDocNode, key: number): ReactNode => {
  let element: ReactNode = node.text;

  (node.marks ?? []).forEach((mark) => {
    if (mark.type === 'link') {
      element = (
        <a
          href={String(mark.attrs?.href ?? '')}
          target="_blank"
          rel="noopener noreferrer"
          // `globals.scss` sets `a { color: inherit; text-decoration: none }` for the whole app, so
          // a link inside a document has to opt back into looking like one.
          className="text-primary underline underline-offset-2"
        >
          {element}
        </a>
      );
      return;
    }
    const Tag = MARK_ELEMENTS[mark.type];
    if (!Tag) return;
    element =
      Tag === 'code' ? (
        <code className="bg-muted px-1 py-0.5 font-mono text-[0.9em]">{element}</code>
      ) : (
        <Tag>{element}</Tag>
      );
  });

  return <Fragment key={key}>{element}</Fragment>;
};

const renderChildren = (nodes: IDocNode[] = []): ReactNode => nodes.map((child, index) => renderNode(child, index));

/**
 * The nodes whose rendering is only "a tag and some classes around the children". Kept as data so
 * the dispatcher below stays short enough to read — the interesting cases are the ones that are
 * not in this table.
 */
const BLOCK_TAGS: Record<string, { tag: keyof React.JSX.IntrinsicElements; className: string }> = {
  paragraph: { tag: 'p', className: 'my-3 leading-7' },
  bulletList: { tag: 'ul', className: 'my-3 list-disc space-y-1 pl-6' },
  orderedList: { tag: 'ol', className: 'my-3 list-decimal space-y-1 pl-6' },
  // The paragraph inside a list item would otherwise inherit the block margin above and push the
  // marker out of line with its text.
  listItem: { tag: 'li', className: '[&>p]:my-0 [&>p]:leading-7' },
  blockquote: { tag: 'blockquote', className: 'my-4 border-l-2 border-border pl-4 text-muted-foreground' },
};

const HEADING_CLASSES: Record<number, string> = {
  1: 'text-2xl mt-6 mb-3',
  2: 'text-xl mt-5 mb-2.5',
  3: 'text-lg mt-4 mb-2',
};

const renderHeading = (node: IDocNode, key: number): ReactNode => {
  const level = Number(node.attrs?.level ?? 1);
  const Tag = `h${Math.min(level, 6)}` as keyof React.JSX.IntrinsicElements;
  return (
    <Tag key={key} className={`font-semibold text-foreground ${HEADING_CLASSES[level] ?? HEADING_CLASSES[3]}`}>
      {renderChildren(node.content)}
    </Tag>
  );
};

function renderNode(node: IDocNode, key: number): ReactNode {
  if (node.type === 'text') return renderText(node, key);
  if (node.type === 'hardBreak') return <br key={key} />;
  if (node.type === 'horizontalRule') return <hr key={key} className="my-6 border-border" />;
  if (node.type === 'heading') return renderHeading(node, key);

  if (node.type === 'inlineMath') return <MathRender key={key} latex={String(node.attrs?.latex ?? '')} />;

  if (node.type === 'blockMath') {
    return (
      <div key={key} className="my-4 overflow-x-auto text-center">
        <MathRender latex={String(node.attrs?.latex ?? '')} displayMode />
      </div>
    );
  }

  if (node.type === 'codeBlock') {
    return (
      <pre key={key} className="my-4 overflow-x-auto bg-muted p-3 font-mono text-xs">
        <code>{renderChildren(node.content)}</code>
      </pre>
    );
  }

  const block = BLOCK_TAGS[node.type];
  if (block) {
    const Tag = block.tag;
    return (
      <Tag key={key} className={block.className}>
        {renderChildren(node.content)}
      </Tag>
    );
  }

  // An unknown node still renders its children rather than dropping them. A reader seeing
  // unstyled text is recoverable; a reader seeing a gap where a question was is not.
  return <Fragment key={key}>{renderChildren(node.content)}</Fragment>;
}

export const RichTextView = ({ doc }: { doc: IDocNode | null }) => {
  if (!doc?.content?.length) {
    return <p className="text-sm text-muted-foreground">Nothing to show yet — start typing on the left.</p>;
  }
  // `max-w-[68ch]` is the measure from the plan's reading-view spec. The editor will share this
  // layer once it moves into `packages/ui`; here the two are still separate.
  return <div className="max-w-[68ch] text-[0.95rem] text-foreground">{renderChildren(doc.content)}</div>;
};
