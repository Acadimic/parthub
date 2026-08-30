import { cn } from '@utils/cn';
import { useEffect, useRef, useState } from 'react';
import { Label } from '../Label';

export interface ITextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  required?: boolean;
  helperText?: string;
  inputClassName?: string;
  error?: boolean;
  multiline?: boolean;
  rows?: number;
}

export const TextInput = (props: ITextInputProps) => {
  const ref = useRef<HTMLInputElement | null>(null);
  const {
    label,
    onFocus,
    onBlur,
    leftSection,
    rightSection,
    placeholder,
    required,
    error,
    helperText,
    autoFocus,
    inputClassName,
    className,
    ...rest
  } = props;
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className={className}>
      {label && <Label label={label} required={required} />}
      <div
        className={cn(
          'bg-background-primary hover:bg-background-secondary flex items-center border rounded-none',
          isFocused
            ? 'border-blue-primary ring-1 ring-blue-primary bg-background-secondary'
            : error
              ? 'border-red-primary'
              : 'border-color-border',
        )}
      >
        {leftSection ? (
          <div className={cn('flex items-center pl-3', isFocused && 'text-blue-primary')}>{leftSection}</div>
        ) : null}
        <input
          {...rest}
          placeholder={placeholder || (label ? `Enter ${label}` : undefined)}
          className={cn('flex-1 px-3 text-sm py-0.5 font-medium bg-transparent outline-none w-full', inputClassName)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          autoFocus={autoFocus}
        />
        {rightSection ? (
          <div className={cn('flex items-center pr-3', isFocused && 'text-blue-primary')}>{rightSection}</div>
        ) : null}
      </div>
      {helperText && (
        <p className={cn('text-xs mt-1', error ? 'text-red-primary' : 'text-color-secondary')}>{helperText}</p>
      )}
    </div>
  );
};
