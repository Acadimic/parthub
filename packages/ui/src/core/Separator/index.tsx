import { Separator as ShadcnSeparator } from '../../ui/separator';
import { cn } from '../../lib/cn';

interface ISeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Separator = ({ orientation = 'horizontal', className }: ISeparatorProps) => {
  return <ShadcnSeparator orientation={orientation} className={cn('bg-color-border', className)} />;
};

export type { ISeparatorProps };
