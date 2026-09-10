import { Html } from '@components/others';
import { type ISelectItem } from '@interfaces';
import { Label } from '@repo/ui/app';

interface IProps {
  label?: string;
  options: ISelectItem[];
  handleClick: (value: string) => void;
  selectedValues: string[];
  required?: boolean;
  isDisabled?: boolean;
  isHtml?: boolean;
  selectedClassName?: string;
}

export const CheckboxSelection = ({
  label,
  required,
  selectedValues,
  handleClick,
  options,
  isDisabled,
  isHtml,
  selectedClassName,
}: IProps) => {
  const handleChange = (option: ISelectItem) => {
    handleClick(option.value);
  };

  const isSelected = (option: ISelectItem) => selectedValues.includes(option.value);

  return (
    <fieldset>
      {label && (
        <legend>
          <Label label={label} required={required} />
        </legend>
      )}
      <div className="flex flex-col">
        {options.map((option) => (
          <label
            key={option.value}
            onClick={() => handleChange(option)}
            className={`flex items-center gap-2 py-1 cursor-pointer ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="checkbox"
              checked={isSelected(option)}
              name={option.value}
              readOnly
              className={`h-4 w-4 rounded border-border ${
                isSelected(option) && selectedClassName ? selectedClassName : option.color || 'text-primary'
              }`}
            />
            <span className="text-foreground text-sm font-medium">
              {isHtml && typeof option.label === 'string' ? <Html html={option.label} /> : option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
