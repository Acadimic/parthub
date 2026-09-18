import { ModalFooter } from './components';
import { Modal } from './Modal';

interface IProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string | React.ReactNode;
  isLoading?: boolean;
  cancelText?: string;
  confirmText?: string;
  /** For a confirm that deletes: the primary action is painted red. */
  isDestructive?: boolean;
}

/**
 * A yes/no dialog. "Soft" because it only asks — the caller performs the action in `onConfirm`, and
 * keeps the dialog open with `isLoading` while it does.
 */
export const SoftConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  isLoading,
  confirmText,
  cancelText,
  isDestructive,
}: IProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      isLoading={isLoading}
      className="w-[calc(100%-2rem)] md:w-[28rem]"
      component={<div className="text-sm leading-6 text-foreground">{description}</div>}
      footer={
        <ModalFooter
          saveText={confirmText || 'Confirm'}
          cancelText={cancelText || 'Cancel'}
          onSave={onConfirm}
          onCancel={onCancel}
          isLoading={isLoading}
          isDestructive={isDestructive}
        />
      }
    />
  );
};
