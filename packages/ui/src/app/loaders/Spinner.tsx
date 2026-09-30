import { type JSX } from 'react';

import { cn } from '../../lib/cn';

interface IProps {
  className?: string;
}

export function Spinner({ className }: IProps): JSX.Element {
  return (
    <div
      className={cn(
        'w-5 h-5 border-2 border-solid border-primary rounded-full animate-spin border-t-transparent',
        className,
      )}
    />
  );
}
