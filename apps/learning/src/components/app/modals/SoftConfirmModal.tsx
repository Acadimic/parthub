import { Modal, ModalFooter } from '.';

interface IProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string | React.ReactNode;
  isLoading?: boolean;
  cancelText?: string;
  confirmText?: string;
}

export const SoftConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  isLoading,
  confirmText,
  cancelText,
}: IProps) => {
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onCancel}
        title={title}
        component={<div className="py-4 text-sm font-medium">{description}</div>}
        footer={
          <ModalFooter
            saveText={confirmText || 'Confirm'}
            cancelText={cancelText || 'Cancel'}
            onSave={onConfirm}
            onCancel={onCancel}
            isLoading={isLoading}
          />
        }
      />
    </>
  );
};
