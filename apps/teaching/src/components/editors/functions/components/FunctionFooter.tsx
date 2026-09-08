import { Button } from '@repo/ui/app';

interface IProps {
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const FunctionFooter = ({ onSave, onCancel, isLoading }: IProps) => {
  return (
    <>
      <div className="flex justify-end items-center space-x-4 mt-4 pt-4">
        <Button isSecondary text="Close" onClick={onCancel} isLoading={isLoading} hideLoadingIcon={true} />
        <Button text="Add" onClick={onSave} isLoading={isLoading} />
      </div>
    </>
  );
};
