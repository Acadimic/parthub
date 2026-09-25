import { type ISelectItem } from '@interfaces';
import { Label } from '@repo/ui/app';
import { getOutcome, SelectionRow } from './SelectionRow';

interface IProps {
  label?: string;
  options: ISelectItem[];
  handleClick: (value: string) => void;
  selectedValues: string[];
  required?: boolean;
  isDisabled?: boolean;
  selectedClassName?: string;
}

/** Any number of choices from a list, each option a full-width row that is the click target. */
export const CheckboxSelection = ({
  label,
  required,
  selectedValues,
  handleClick,
  options,
  isDisabled,
  selectedClassName,
}: IProps) => {
  const isSelected = (option: ISelectItem) => selectedValues.includes(option.value);

  return (
    <fieldset>
      {label && (
        <legend className="mb-2">
          <Label label={label} required={required} />
        </legend>
      )}
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <SelectionRow
            key={option.value}
            kind="checkbox"
            isSelected={isSelected(option)}
            isDisabled={Boolean(isDisabled)}
            outcome={getOutcome(option.color)}
            className={isSelected(option) ? selectedClassName : undefined}
            input={
              <input
                type="checkbox"
                name={option.value}
                checked={isSelected(option)}
                onChange={() => handleClick(option.value)}
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
