import { cn } from '../../lib/cn';

interface ISpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
};

/** `className` is merged, so a caller can override the size or the colour without restating the rest. */
export const Spinner = ({ size = 'md', className }: ISpinnerProps) => {
  return (
    <div
      className={cn(
        sizeMap[size],
        'border-2 border-solid border-primary rounded-full animate-spin border-t-transparent',
        className,
      )}
    />
  );
};

export type { ISpinnerProps };
