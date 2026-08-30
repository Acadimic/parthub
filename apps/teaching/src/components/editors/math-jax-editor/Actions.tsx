import { ModalFooter } from '@components/app';

interface IProps {
  handleSubmit: () => void;
  closeModal: () => void;
}

export const Actions = ({ handleSubmit, closeModal }: IProps) => {
  const onSubmit = () => {
    const result = handleSubmit();
    if (result === void 0 || result !== false) closeModal();
  };

  return (
    <div className="mt-6">
      <ModalFooter saveText="Add" cancelText="Close" onSave={onSubmit} onCancel={closeModal} />
    </div>
  );
};
