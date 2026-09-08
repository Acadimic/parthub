import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../lib/cn';

interface ITooltipProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  arrow?: boolean;
  className?: string;
}

export const Tooltip = ({ children, title, placement = 'top', className }: ITooltipProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <ShadcnTooltip>
        <TooltipTrigger asChild>
          <span>{children}</span>
        </TooltipTrigger>
        <TooltipContent side={placement} className={cn('bg-color-primary text-color-opposite text-xs', className)}>
          {title || children}
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  );
};

export type { ITooltipProps };
