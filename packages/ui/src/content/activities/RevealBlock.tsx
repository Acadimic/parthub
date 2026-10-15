import { EyeIcon, EyeSlashIcon, LightbulbIcon } from '@phosphor-icons/react';
import { type ReactNode, useState } from 'react';
import { cn } from '../../lib/cn';
import { ActivityFrame, OUTLINE_PILL, PRIMARY_PILL } from './ActivityFrame';

interface IRevealBlockProps {
  prompt: ReactNode;
  answer: ReactNode;
}

/** A question with its answer folded away under it; the learner opens it when ready. Print shows both. */
export const RevealBlock = ({ prompt, answer }: IRevealBlockProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <ActivityFrame icon={LightbulbIcon} title="Think, then check">
      <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{prompt}</div>
      <div className="mt-3 print:hidden">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className={isOpen ? OUTLINE_PILL : PRIMARY_PILL}
        >
          {isOpen ? (
            <EyeSlashIcon className="h-3.5 w-3.5" weight="bold" />
          ) : (
            <EyeIcon className="h-3.5 w-3.5" weight="bold" />
          )}
          {isOpen ? 'Hide answer' : 'Show answer'}
        </button>
      </div>
      <div
        className={cn(
          'mt-3 border-l-2 border-success bg-success/10 px-3 py-2 animate-fade-in [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          !isOpen && 'hidden print:block',
        )}
      >
        {answer}
      </div>
    </ActivityFrame>
  );
};
