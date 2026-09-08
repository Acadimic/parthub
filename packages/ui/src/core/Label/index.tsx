import { AsteriskIcon } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

interface ILabelProps {
  children?: React.ReactNode;
  label?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}

export const Label = ({ children, label, required, htmlFor, className }: ILabelProps) => {
  return (
    <label htmlFor={htmlFor} className={cn('text-sm font-semibold py-1', className)}>
      <div className="text-color-primary flex items-center space-x-1.5">
        <div>{label || children}</div>
        {required && <AsteriskIcon weight="bold" className="text-red-primary w-3 h-3" />}
      </div>
    </label>
  );
};

export type { ILabelProps };
