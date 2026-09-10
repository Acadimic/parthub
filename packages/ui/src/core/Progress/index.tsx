import { Progress as ShadcnProgress } from '../../ui/progress';
import { cn } from '../../lib/cn';

interface IProgressProps {
  value: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
  variant?: 'linear' | 'circular';
}

export const Progress = ({ value, showLabel, className, variant = 'linear' }: IProgressProps) => {
  if (variant === 'circular') {
    const circumference = 2 * Math.PI * 18;
    const offset = circumference - (value / 100) * circumference;
    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" className="text-border" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            className="text-primary"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        {showLabel && <span className="absolute text-xs font-semibold">{Math.round(value)}%</span>}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <ShadcnProgress value={value} className="h-2 bg-border [&>div]:bg-primary" />
      {showLabel && <span className="text-xs text-muted-foreground mt-1">{Math.round(value)}%</span>}
    </div>
  );
};

export type { IProgressProps };
