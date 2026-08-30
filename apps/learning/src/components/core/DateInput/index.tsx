import { PopoverContent, Popover as ShadcnPopover, PopoverTrigger } from '@components/ui/popover';
import { CalendarBlank } from '@phosphor-icons/react';
import * as React from 'react';
import { TextInput } from '../TextInput';

interface IDateInputProps {
  value?: string;
  onChange?: (date: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
}

export const DateInput = ({
  value,
  onChange,
  label,
  required,
  disabled,
  placeholder = 'Select date',
  className,
  min,
  max,
}: IDateInputProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <ShadcnPopover>
      <PopoverTrigger asChild disabled={disabled}>
        <div className={className}>
          <TextInput
            label={label}
            required={required}
            placeholder={placeholder}
            readOnly
            value={formatDate(value)}
            rightSection={<CalendarBlank weight="bold" className="w-4 h-4" />}
            disabled={disabled}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-background-primary border border-color-border" align="start">
        <input
          ref={inputRef}
          type="date"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          min={min}
          max={max}
          className="text-sm bg-transparent outline-none border border-color-border rounded px-2 py-1"
        />
      </PopoverContent>
    </ShadcnPopover>
  );
};

export type { IDateInputProps };
