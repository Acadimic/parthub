import { type ISelectItem } from '@interfaces';
import * as React from 'react';
import { Label } from '@repo/ui/app';
import { getOutcome, SelectionRow } from './SelectionRow';

interface IProps {
  label?: string;
  options: ISelectItem[];
  handleClick: (selectedValue: string) => void;
  selectedValue?: string;
  required?: boolean;
  isDisabled?: boolean;
  selectedClassName?: string;
}

/** One choice from a list, each option a full-width row that is the click target. */
export const RadioSelection = ({
  label,
  required,
  selectedValue,
  handleClick,
  options,
  isDisabled,
  selectedClassName,
}: IProps) => {
  const groupName = React.useId();
  const isSelected = (option: ISelectItem) => option.value === selectedValue;

  return (
    <fieldset>
      {label && (
        <legend className="mb-2">
          <Label label={label} required={required} />
        </legend>
      )}
      <div className="flex flex-col gap-2" role="radiogroup">
        {options.map((option) => (
          <SelectionRow
            key={option.value}
            kind="radio"
            isSelected={isSelected(option)}
            isDisabled={Boolean(isDisabled)}
            outcome={getOutcome(option.color)}
            className={isSelected(option) ? selectedClassName : undefined}
            input={
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={isSelected(option)}
                onChange={(event) => handleClick(event.target.value)}
                disabled={isDisabled}
              />
            }
          >
            {option.label}
          </SelectionRow>
        ))}
      </div>
    </fieldset>
  );
};
