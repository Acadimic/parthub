import { type ReactNode } from 'react';

interface IProps {
  value: number;
  thickness?: number;
  label?: ReactNode;
  size?: number;
  className?: string;
}

export const CircularProgress = ({ className, value: valueProp, size, thickness: thicknessProp, label }: IProps) => {
  const thickness = thicknessProp || 6;
  const value = valueProp || 1;
  const resolvedSize = size || 140;
  const radius = (resolvedSize - thickness * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex" style={{ width: resolvedSize, height: resolvedSize }}>
      <svg className="transform -rotate-90" width={resolvedSize} height={resolvedSize}>
        <circle
          cx={resolvedSize / 2}
          cy={resolvedSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-border"
        />
        <circle
          cx={resolvedSize / 2}
          cy={resolvedSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={className || 'text-primary'}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div>{label || value}</div>
      </div>
    </div>
  );
};
