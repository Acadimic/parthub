interface IProps {
  checked: boolean;
  selectedClassName?: string;
}

export const Checkbox = ({ checked, selectedClassName }: IProps) => {
  return (
    <div>
      <input
        type="checkbox"
        checked={checked}
        readOnly
        className={`h-4 w-4 rounded border-border text-info focus:ring-primary ${selectedClassName || ''}`}
      />
    </div>
  );
};
