import { Switch as SwitchPrimitive } from '../../ui/switch';
import { Label } from './Label';

export interface ISwitchProps {
  label?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch = ({ label, checked, onCheckedChange, disabled, className }: ISwitchProps) => {
  return (
    <div className="flex flex-col space-y-0 justify-start items-start">
      {label && (
        <div className="pl-3">
          <Label label={label} required />
        </div>
      )}
      <div className="pl-3 py-1">
        <SwitchPrimitive
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={className}
        />
      </div>
    </div>
  );
};
