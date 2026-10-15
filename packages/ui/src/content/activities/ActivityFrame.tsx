import type { Icon } from '@phosphor-icons/react';
import type { IRichTextNode } from '@repo/shared/interfaces';
import { docToPlainText, type IPronunciationAttrs, PRONUNCIATION_MARK, pronunciationAttrsOf } from '@repo/shared/utils';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const PILL_CLASS =
  'inline-flex h-8 items-center gap-1.5 px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40';

export const PRIMARY_PILL = cn(PILL_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90');
export const OUTLINE_PILL = cn(PILL_CLASS, 'border border-border bg-background text-foreground hover:bg-accent');

interface IActivityFrameProps {
  icon: Icon;
  title: string;
  children: ReactNode;
  /** Controls at the right of the header, such as "Show answer". */
  actions?: ReactNode;
  className?: string;
}

/** The card every interactive block sits in, so they read as one family beside the listening block. */
export const ActivityFrame = ({ icon: IconComponent, title, children, actions, className }: IActivityFrameProps) => (
  <section className={cn('my-5 border border-border bg-card text-card-foreground', className)} aria-label={title}>
    {/* A fixed height, so a button appearing in the header after a tap never changes it. */}
    <header className="flex min-h-12 flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
        <IconComponent className="h-4 w-4" weight="bold" />
      </span>
      <span className="text-xs font-semibold text-foreground">{title}</span>
      {actions ? <span className="ml-auto flex items-center gap-1.5 print:hidden">{actions}</span> : null}
    </header>
    <div className="px-4 py-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
  </section>
);

export interface ISpoken {
  /** What is said: the first pronounced run in the node. */
  text: string;
  pronunciation: IPronunciationAttrs;
}

/** The first pronounced run inside a node, so a tile or a card can speak without a popover. */
export const spokenOf = (node: IRichTextNode | undefined): ISpoken | null => {
  const texts: IRichTextNode[] = [];
  const walk = (current: IRichTextNode | undefined) => {
    current?.content?.forEach((child) => {
      if (child.type === 'text') texts.push(child);
      else walk(child);
    });
  };
  walk(node);
  const start = texts.findIndex((text) => text.marks?.some((mark) => mark.type === PRONUNCIATION_MARK));
  if (start < 0) return null;
  const mark = texts[start].marks?.find((item) => item.type === PRONUNCIATION_MARK);
  if (!mark) return null;
  const pronunciation = pronunciationAttrsOf(mark);
  let end = start + 1;
  while (
    end < texts.length &&
    texts[end].marks?.some((item) => item.type === PRONUNCIATION_MARK && item.attrs?.audio === mark.attrs?.audio)
  ) {
    end += 1;
  }
  const text = docToPlainText({ type: 'paragraph', content: texts.slice(start, end) }).trim();
  return text ? { text, pronunciation } : null;
};
