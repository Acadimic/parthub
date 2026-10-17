import { BookOpenTextIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

interface IConceptBlockProps {
  title: string;
  children: ReactNode;
}

/**
 * A concept to read before practising it: a tinted panel with a rule down its left edge, so a reading
 * screen looks different from the interactive blocks around it. Its text is ordinary rich text.
 */
export const ConceptBlock = ({ title, children }: IConceptBlockProps) => {
  // A closing "Key points" box names itself, so its title is not repeated under the label.
  const isKeyPoints = /^key points$/i.test(title.trim());
  const label = isKeyPoints ? 'Key points' : 'Concept';
  const shownTitle = isKeyPoints ? '' : title;
  return (
    <section
      className="my-5 border-l-4 border-primary bg-primary/5 px-4 py-3 text-foreground"
      aria-label={title || label}
    >
      <header className="mb-2 flex items-center gap-2">
        <BookOpenTextIcon className="h-4 w-4 text-primary" weight="bold" />
        <span className="text-xs font-semibold uppercase tracking-caps text-primary">{label}</span>
        {shownTitle ? <span className="text-sm font-semibold text-foreground">{shownTitle}</span> : null}
      </header>
      <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
    </section>
  );
};
