import InputBase, { InputBaseProps } from '@mui/material/InputBase';
import { useEffect, useRef, useState } from 'react';
import { Label } from '../Label';

export interface ITextInputProps extends InputBaseProps {
  label?: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  required?: boolean;
  helperText?: string;
  inputClassName?: string;
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
    size,
    ...rest
  } = props;
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const sizeClass = size === 'small' ? 'py-0' : 'py-0.5';

  return (
    <div>
      {label && <Label label={label} required={required} />}
      <div
        className={`bg-background-primary hover:bg-background-secondary flex items-center border rounded-none
          ${isFocused ? 'border-blue-primary ring-1 ring-blue-primary bg-background-secondary' : error ? 'border-red-primary' : 'border-color-border'}
        `}
      >
        {leftSection ? (
          <div className={`flex items-center ${isFocused ? 'text-blue-primary' : ''} pl-3`}>{leftSection}</div>
        ) : null}
        <InputBase
          {...rest}
          placeholder={placeholder || (label ? `Enter ${label}` : undefined)}
          className={`flex-1 px-3 text-sm ${sizeClass} font-medium`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          classes={{ input: inputClassName || '' }}
          ref={ref}
          autoFocus={autoFocus}
          error={error}
        />
        {rightSection ? (
          <div className={`flex items-center ${isFocused ? 'text-blue-primary' : ''} pr-3`}>{rightSection}</div>
        ) : null}
      </div>
      {helperText && (
        <p className={`text-xs mt-1 ${error ? 'text-red-primary' : 'text-color-secondary'}`}>{helperText}</p>
      )}
    </div>
  );
};
