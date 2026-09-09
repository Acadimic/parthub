import { Html } from '@components/others';
import { type ISelectItem } from '@interfaces';
import * as React from 'react';
import { Label } from '@repo/ui/app';

interface IProps {
  label?: string;
  options: ISelectItem[];
  handleClick: (selectedValue: string) => void;
  selectedValue?: string;
  required?: boolean;
  isDisabled?: boolean;
  isHtml?: boolean;
  selectedClassName?: string;
}

export const RadioSelection = ({
  label,
  required,
  selectedValue,
  handleClick,
  options,
  isDisabled,
  isHtml,
  selectedClassName,
}: IProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleClick(event.target.value);
  };

  const isSelected = (option: ISelectItem) => option.value === selectedValue;

  return (
    <fieldset>
      {label && (
        <legend>
          <Label label={label} required={required} />
        </legend>
      )}
      <div className="flex flex-col" role="radiogroup" aria-labelledby="controlled-radio-buttons-group">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-2 py-1 cursor-pointer ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="radio"
              name="controlled-radio-buttons-group"
              value={option.value}
              checked={isSelected(option)}
              onChange={handleChange}
              className={`h-4 w-4 border-color-border ${
                isSelected(option) && selectedClassName ? selectedClassName : option.color || 'text-blue-primary'
              }`}
            />
            <span className="text-color-primary text-sm font-medium">
              {isHtml && typeof option.label === 'string' ? <Html html={option.label} /> : option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
