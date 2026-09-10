import { Skeleton as ShadcnSkeleton } from '../../ui/skeleton';
import { cn } from '../../lib/cn';

interface ISkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'rectangle' | 'circle';
}

export const Skeleton = ({ width, height, className, variant = 'rectangle' }: ISkeletonProps) => {
  return (
    <ShadcnSkeleton
      className={cn('bg-muted', variant === 'circle' && 'rounded-full', className)}
      style={{
        width: width || '100%',
        height: height || '100%',
      }}
    />
  );
};

export type { ISkeletonProps };
