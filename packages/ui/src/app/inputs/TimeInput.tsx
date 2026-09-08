import { ClockIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { Popover } from '../popovers';
import { TextInput } from '@repo/ui/app';

export interface ITimeInputProps {
  label?: string;
  handleChange: (date: Date) => void;
  value: Date | string | null;
  required?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export const TimeInput = ({ value, label, handleChange, required, isDisabled, className }: ITimeInputProps) => {
  return (
    <div className={className}>
      <Popover
        component={({ handleClose }) => {
          const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const [hours, minutes] = e.target.value.split(':').map(Number);
            const date = value ? new Date(value) : new Date();
            date.setHours(hours, minutes, 0, 0);
            handleChange(date);
            if (handleClose) handleClose();
          };

          const currentValue = value ? dayjs(value).format('HH:mm') : '';

          return (
            <div className="p-4">
              <input
                type="time"
                defaultValue={currentValue}
                onChange={onTimeChange}
                className="bg-background-primary border border-color-border rounded px-3 py-2 text-sm font-medium outline-none focus:border-blue-primary"
              />
            </div>
          );
        }}
      >
        <TextInput
          label={label}
          type="text"
          placeholder="Select Time"
          rightsection={<ClockIcon className="w-5 h-5 text-color-text" />}
          readOnly
          value={value ? dayjs(value).format('hh:mm A') : ''}
          required={required}
          disabled={isDisabled}
        />
      </Popover>
    </div>
  );
};
