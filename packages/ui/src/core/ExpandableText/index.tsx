import * as React from 'react';
import { cn } from '../../lib/cn';
import { Button } from '../Button';

export interface IExpandableTextProps {
  text: string;
  /** Type size and colour; the toggle takes the same size, so it lines up with the text. */
  className?: string;
}

/**
 * Text clamped to three lines with a "Show more" at the end of the last one, shown only when the
 * text runs past them. The fade under the toggle is `bg-background`, so place it on that surface.
 */
export const ExpandableText = ({ text, className }: IExpandableTextProps) => {
  const id = React.useId();
  const ref = React.useRef<HTMLParagraphElement>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  // Re-measured on resize, since a narrower column wraps the same text onto more lines.
  React.useEffect(() => {
    const element = ref.current;
    if (!element || isExpanded) return;
    const measure = () => setIsOverflowing(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, isExpanded]);

  const toggle = (
    <Button
      isSubtle
      aria-expanded={isExpanded}
      aria-controls={id}
      className="ml-1 border-0 p-0 text-[length:inherit] font-semibold text-primary hover:bg-transparent hover:underline"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? 'Show less' : 'Show more'}
    </Button>
  );

  return (
    <div className={cn('relative', className)}>
      <p ref={ref} id={id} className={cn(!isExpanded && 'line-clamp-3')}>
        {text}
        {isExpanded ? <> {toggle}</> : null}
      </p>
      {isOverflowing && !isExpanded ? (
        <span className="absolute bottom-0 right-0 flex bg-gradient-to-r from-transparent via-background via-30% to-background pl-12">
          <span aria-hidden="true">…&nbsp;</span>
          {toggle}
        </span>
      ) : null}
    </div>
  );
};
