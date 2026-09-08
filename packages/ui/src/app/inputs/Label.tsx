import { AsteriskIcon } from '@phosphor-icons/react';

interface IProps {
  label: string;
  required?: boolean;
}

export const Label = ({ label, required }: IProps) => {
  return (
    <div className="text-sm font-semibold py-1">
      <div className="text-color-primary flex items-center space-x-1.5">
        <div>{label}</div>
        {required && <AsteriskIcon weight="bold" className="text-red-primary w-3 h-3" />}
      </div>
    </div>
  );
};
