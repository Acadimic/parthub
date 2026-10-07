import { useId } from 'react';
import { Slider as ShadcnSlider } from '../../ui/slider';
import { cn } from '../../lib/cn';

interface ISliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** Shown above the track, with the current value at the other end. */
  label: React.ReactNode;
  /** How the current value is written beside the label. */
  formatValue?: (value: number) => string;
  className?: string;
}

/** A single-thumb slider with a label and its live value, keyboard-operable through Radix. */
export const Slider = ({ value, onChange, min, max, step, label, formatValue, className }: ISliderProps) => {
  const labelId = useId();
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span id={labelId} className="font-semibold text-foreground">
          {label}
        </span>
        <span className="font-mono tabular-nums text-muted-foreground">{formatValue ? formatValue(value) : value}</span>
      </div>
      <ShadcnSlider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
        aria-labelledby={labelId}
      />
    </div>
  );
};

export type { ISliderProps };
