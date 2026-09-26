import { cn } from '@repo/ui/lib';
import { type ReactNode } from 'react';

interface IProps {
  children: ReactNode;
  /** The band's own fill, which runs edge to edge behind the content column. */
  className: string;
}

/**
 * A full-width strip with the content column of `Container` inside it. `Container` paints its own
 * background, which would cover a wash or a tint, so the sections that want one use this instead.
 */
export const Band = ({ children, className }: IProps) => (
  <div className={cn('px-4 md:px-8', className)}>
    <div className="md:px-16">{children}</div>
  </div>
);
