import { useEffect, useRef, useState } from 'react';
import { Label } from './Label';

interface IProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftsection?: React.ReactNode;
  rightsection?: React.ReactNode;
  required?: boolean;
  className?: string;
  autoFocus?: boolean;
  multiline?: boolean;
  rows?: number;
}

export const TextInput = (props: IProps) => {
  const ref = useRef<HTMLInputElement | null>(null);
  const {
    label,
    onFocus,
    onBlur,
    leftsection,
    rightsection,
    placeholder,
    required,
    className,
    autoFocus,
    multiline,
    rows,
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
    <div>
      {label && <Label label={label} required={required} />}
      <div
        className={`bg-background hover:bg-accent flex items-center border rounded-md ${isFocused ? 'border-primary bg-muted' : 'border-border'}`}
      >
        {leftsection ? (
          <div className={`flex items-center ${isFocused ? 'text-primary' : ''} pl-3`}>{leftsection}</div>
        ) : null}
        <input
          {...rest}
          placeholder={placeholder || `Enter ${label}`}
          className={`flex-1 px-3 text-sm py-2 font-medium bg-transparent outline-none w-full ${className || ''}`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          autoFocus={autoFocus}
        />
        {rightsection ? (
          <div className={`flex items-center ${isFocused ? 'text-primary' : ''} pr-3`}>{rightsection}</div>
        ) : null}
      </div>
    </div>
  );
};
