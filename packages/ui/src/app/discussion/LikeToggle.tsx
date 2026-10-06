import { ThumbsUpIcon } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';
import { Tooltip } from '../tooltips/Tooltip';

interface IProps {
  count: number;
  isLiked: boolean;
  /** Why the button cannot be pressed — "Sign in to like" — or null when it can. */
  disabledHint: string | null;
  onToggle: () => void;
}

/** A thumbs-up with its count, filled once liked. */
export const LikeToggle = ({ count, isLiked, disabledHint, onToggle }: IProps) => {
  const action = isLiked ? 'Unlike' : 'Like';
  return (
    <Tooltip title={disabledHint ?? action}>
      <button
        type="button"
        disabled={Boolean(disabledHint)}
        aria-pressed={isLiked}
        aria-label={`${action}, ${count} ${count === 1 ? 'like' : 'likes'}`}
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1 text-xs font-semibold transition-colors disabled:cursor-default',
          isLiked ? 'text-primary' : 'text-muted-foreground enabled:hover:text-primary',
        )}
      >
        <ThumbsUpIcon weight={isLiked ? 'fill' : 'bold'} className="h-3.5 w-3.5" />
        {count ? <span className="tabular-nums">{count}</span> : <span>Like</span>}
      </button>
    </Tooltip>
  );
};
