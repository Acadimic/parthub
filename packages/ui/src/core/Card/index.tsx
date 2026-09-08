import { cn } from '../../lib/cn';
import { type ReactNode } from 'react';

interface ICardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = ({ children, className, onClick }: ICardProps) => {
  return (
    <div
      className={cn(
        'bg-background-primary border-color-border relative h-full',
        className || 'px-4 py-4 border rounded-lg',
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export type { ICardProps };
