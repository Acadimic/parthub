import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { cn } from '../../lib/cn';
import { keepSelection } from '../toolbar/ToolbarButton';

/** A check option as the author sees it: its text, and a toggle saying whether it is a right answer. */
export const CheckOptionNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const isCorrect = node.attrs.correct === true;
  return (
    <NodeViewWrapper
      className={cn(
        'my-1.5 flex items-start gap-2 border px-2 [&_p]:my-1.5',
        isCorrect ? 'border-success bg-success/10' : 'border-border',
      )}
    >
      <button
        type="button"
        contentEditable={false}
        onMouseDown={keepSelection}
        onClick={() => updateAttributes({ correct: !isCorrect })}
        aria-pressed={isCorrect}
        title={isCorrect ? 'Right answer — click to mark wrong' : 'Wrong answer — click to mark right'}
        className="mt-1.5 shrink-0"
      >
        {isCorrect ? (
          <CheckCircleIcon className="h-5 w-5 text-success" weight="fill" />
        ) : (
          <XCircleIcon className="h-5 w-5 text-muted-foreground" weight="regular" />
        )}
      </button>
      <NodeViewContent className="min-w-0 flex-1" />
    </NodeViewWrapper>
  );
};
