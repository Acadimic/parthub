import { Button } from '../../buttons';

interface IProps {
  saveText?: string;
  cancelText?: string;
  closeText?: string;
  onSave: () => void;
  onCancel: () => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export const ModalFooter = ({ saveText, cancelText, closeText, onSave, onCancel, isLoading, onClose }: IProps) => {
  return (
    <>
      <div className="flex justify-between w-full">
        <div>
          {closeText && onClose && (
            <Button isSubtle text={closeText} onClick={onClose} isLoading={isLoading} hideLoadingIcon={true} />
          )}
        </div>
        <div className="flex justify-end items-center space-x-4">
          <Button
            isSecondary
            text={cancelText || 'Cancel'}
            onClick={onCancel}
            isLoading={isLoading}
            hideLoadingIcon={true}
          />
          <Button text={saveText || 'Save'} onClick={onSave} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
};
