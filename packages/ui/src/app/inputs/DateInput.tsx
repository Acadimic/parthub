import { CalendarBlankIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { Popover } from '../popovers';
import { TextInput } from './TextInput';

interface IProps {
  label?: string;
  handleChange: (date: Date) => void;
  value: Date | null;
  required?: boolean;
  isDisabled?: boolean;
}

export const DateInput = ({ value, label, handleChange, required, isDisabled }: IProps) => {
  return (
    <div>
      <Popover
        component={({ handleClose }) => {
          const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const date = new Date(e.target.value);
            if (!isNaN(date.getTime())) {
              handleChange(date);
              if (handleClose) handleClose();
            }
          };

          return (
            <div className="p-4">
              <input
                type="date"
                defaultValue={value ? dayjs(value).format('YYYY-MM-DD') : ''}
                onChange={onDateChange}
                className="bg-background border border-border rounded px-3 py-2 text-sm font-medium outline-none focus:border-primary"
              />
            </div>
          );
        }}
      >
        <TextInput
          label={label}
          type="text"
          placeholder="Select Date"
          rightsection={<CalendarBlankIcon className="w-5 h-5 text-foreground" />}
          readOnly
          value={value ? dayjs(value).format('MMM, DD, YYYY') : ''}
          required={required}
          disabled={isDisabled}
        />
      </Popover>
    </div>
  );
};
