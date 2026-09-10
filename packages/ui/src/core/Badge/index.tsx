import { Badge as ShadcnBadge } from '../../ui/badge';
import { cn } from '../../lib/cn';

interface IBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className }: IBadgeProps) => {
  return (
    <ShadcnBadge
      variant={variant}
      className={cn('text-xs font-medium', variant === 'default' && 'bg-primary hover:bg-primary/90', className)}
    >
      {children}
    </ShadcnBadge>
  );
};

export type { IBadgeProps };
