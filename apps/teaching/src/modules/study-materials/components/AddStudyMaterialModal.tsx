import { Select } from '@components/app/selects';
import { Modal, ModalFooter } from '@repo/ui/app';
import { PositionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { useStandardLookups, useSelectorLookups } from '@stores';
import { useState } from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  handleSelect: (standardId: string, subjectId: string) => void;
}

export const AddStudyMaterialModal = ({ isOpen, onClose, handleSelect }: IProps) => {
  const selectorStore = useSelectorLookups();
  const { getStandardItems, getStandardSubjectItems } = useStandardLookups();
  const {
    selectedStandardId,
    selectedSubjectId,
    setSelectedStandardId,
    setSelectedSubjectId,
    removeSelectedStandardId,
    removeSelectedSubjectId,
  } = selectorStore;
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = async () => {
    removeSelectedStandardId();
    removeSelectedSubjectId();
    onClose();
  };

  const handleStandardChange = (values: ISelectItem[]) => {
    if (!values.length) return;
    setSelectedStandardId(values[0].value);
  };

  const handleSubjectChange = (values: ISelectItem[]) => {
    if (!values.length) return;
    setSelectedSubjectId(values[0].value);
  };

  const handleSubmit = async () => {
    if (!selectedStandardId || !selectedSubjectId) return;
    setIsLoading(true);
    handleSelect(selectedStandardId, selectedSubjectId);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <>
      <Modal
        position={PositionType.RIGHT}
        title="Select Study Material Details"
        isOpen={isOpen}
        isLoading={isLoading}
        onClose={closeModal}
        component={
          <div className="min-h-[60vh] pb-4">
            <div className="flex flex-col space-y-3">
              <Select
                label="Standard"
                items={getStandardItems()}
                required
                isGrouped
                values={selectedStandardId ? [selectedStandardId] : []}
                onChange={handleStandardChange}
                isSingleSelect
              />
              <Select
                label="Subject"
                items={selectedStandardId ? getStandardSubjectItems(selectedStandardId) || [] : []}
                values={selectedSubjectId ? [selectedSubjectId] : []}
                onChange={handleSubjectChange}
                isSingleSelect
                required
              />
            </div>
          </div>
        }
        footer={
          <ModalFooter
            saveText="Select"
            cancelText="Cancel"
            onSave={handleSubmit}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        }
      />
    </>
  );
};
