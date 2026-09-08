import { Checkbox as ShadcnCheckbox } from '../../ui/checkbox';
import { cn } from '../../lib/cn';

interface ICheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const Checkbox = ({ checked, onChange, label, className, disabled, id }: ICheckboxProps) => {
  const checkboxId = id || `checkbox-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  const checkbox = (
    <ShadcnCheckbox
      id={checkboxId}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      className={cn(
        'border-color-border data-[state=checked]:bg-blue-primary data-[state=checked]:border-blue-primary',
        className,
      )}
    />
  );

  if (label) {
    return (
      <div className="flex items-center space-x-2">
        {checkbox}
        <label htmlFor={checkboxId} className="text-sm text-color-primary cursor-pointer">
          {label}
        </label>
      </div>
    );
  }

  return checkbox;
};

export type { ICheckboxProps };
