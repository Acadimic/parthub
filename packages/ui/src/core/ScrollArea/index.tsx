import { ScrollArea as ShadcnScrollArea, ScrollBar } from '../../ui/scroll-area';
import { cn } from '../../lib/cn';

interface IScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'vertical' | 'horizontal' | 'both';
}

export const ScrollArea = ({ children, className, orientation = 'vertical' }: IScrollAreaProps) => {
  return (
    <ShadcnScrollArea className={cn('w-full', className)}>
      {children}
      {(orientation === 'vertical' || orientation === 'both') && <ScrollBar orientation="vertical" />}
      {(orientation === 'horizontal' || orientation === 'both') && <ScrollBar orientation="horizontal" />}
    </ShadcnScrollArea>
  );
};

export type { IScrollAreaProps };
