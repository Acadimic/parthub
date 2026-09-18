import { Button } from '../../buttons';

interface IProps {
  saveText?: string;
  cancelText?: string;
  closeText?: string;
  onSave: () => void;
  onCancel: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  /** Leaves out the cancel button, for a footer whose only choices are its primary action and Close. */
  hideCancel?: boolean;
  /** Paints the primary action red — for a confirm whose action deletes something. */
  isDestructive?: boolean;
  /** Disables the primary action without putting it in the loading state. */
  isSaveDisabled?: boolean;
}

export const ModalFooter = ({
  saveText,
  cancelText,
  closeText,
  onSave,
  onCancel,
  isLoading,
  onClose,
  hideCancel,
  isDestructive,
  isSaveDisabled,
}: IProps) => {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div>
        {closeText && onClose && (
          <Button isSubtle text={closeText} onClick={onClose} isLoading={isLoading} hideLoadingIcon={true} />
        )}
      </div>
      <div className="flex items-center justify-end gap-2.5">
        {!hideCancel && (
          <Button
            isSecondary
            text={cancelText || 'Cancel'}
            onClick={onCancel}
            isLoading={isLoading}
            hideLoadingIcon={true}
          />
        )}
        <Button
          text={saveText || 'Save'}
          onClick={onSave}
          isLoading={isLoading}
          isDestructive={isDestructive}
          disabled={isSaveDisabled}
        />
      </div>
    </div>
  );
};
