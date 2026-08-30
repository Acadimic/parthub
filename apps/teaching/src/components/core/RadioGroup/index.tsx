import { ISelectItem } from '@interfaces';
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { cn } from '@utils/cn';
import { Label } from '../Label';

interface IRadioGroupProps {
  options: ISelectItem[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  isHtml?: boolean;
}

export const RadioGroup = ({
  options,
  value,
  onChange,
  label,
  required,
  disabled,
  className,
  isHtml,
}: IRadioGroupProps) => {
  return (
    <div className={className}>
      {label && <Label label={label} required={required} />}
      <ShadcnRadioGroup value={value} onValueChange={onChange} disabled={disabled} className="mt-1 space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`radio-${option.value}`}
              className={cn('border-color-border', value === option.value && 'border-blue-primary text-blue-primary')}
            />
            <label
              htmlFor={`radio-${option.value}`}
              className={cn('text-sm font-medium cursor-pointer', value === option.value && 'text-blue-primary')}
            >
              {isHtml ? <span dangerouslySetInnerHTML={{ __html: option.label as string }} /> : option.label}
            </label>
          </div>
        ))}
      </ShadcnRadioGroup>
    </div>
  );
};

export type { IRadioGroupProps };
