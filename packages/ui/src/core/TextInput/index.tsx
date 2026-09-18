import { cn } from '../../lib/cn';
import { useEffect, useRef, useState } from 'react';
import { Label } from '../Label';

export interface ITextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Reaches the underlying `<input>`, for a caller that has to read the caret or place focus. */
  ref?: React.Ref<HTMLInputElement>;
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
    ref: forwardedRef,
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

  let borderClass = 'border-border';
  if (isFocused) borderClass = 'border-primary ring-1 ring-primary bg-muted';
  else if (error) borderClass = 'border-destructive';

  return (
    <div className={className}>
      {label && <Label label={label} required={required} />}
      <div className={cn('bg-background hover:bg-accent flex items-center border rounded-md', borderClass)}>
        {leftSection ? (
          <div className={cn('flex items-center pl-3', isFocused && 'text-primary')}>{leftSection}</div>
        ) : null}
        <input
          {...rest}
          placeholder={placeholder || (label ? `Enter ${label}` : undefined)}
          className={cn('flex-1 px-3 text-sm py-0.5 font-medium bg-transparent outline-none w-full', inputClassName)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          // Both the internal focus ref and the caller's see the same element. React 19 passes
          // `ref` as an ordinary prop, so no `forwardRef` wrapper is needed.
          ref={(element) => {
            ref.current = element;
            if (typeof forwardedRef === 'function') forwardedRef(element);
            else if (forwardedRef) forwardedRef.current = element;
          }}
          autoFocus={autoFocus}
        />
        {rightSection ? (
          <div className={cn('flex items-center pr-3', isFocused && 'text-primary')}>{rightSection}</div>
        ) : null}
      </div>
      {helperText && (
        <p className={cn('text-xs mt-1', error ? 'text-destructive' : 'text-muted-foreground')}>{helperText}</p>
      )}
    </div>
  );
};
