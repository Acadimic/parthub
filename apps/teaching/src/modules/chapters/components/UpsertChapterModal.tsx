import { Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { ChapterService } from '@services';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertChapterModal = observer(({ isOpen, onClose }: IProps) => {
  const { selectorStore, standardStore } = useStores();
  const { selectedChapter } = selectorStore;
  const [isLoading, setIsLoading] = useState(false);

  const saveChapter = async () => {
    if (!selectedChapter) return;
    try {
      setIsLoading(true);
      await ChapterService.upsertChapter(selectedChapter);
      selectedChapter.resetIsNew();
      onClose();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  if (!selectedChapter) return null;

  const standardObj = standardStore.getStandardById(selectedChapter?.standard);
  const subjectObj = standardStore.getSubjectById(selectedChapter?.subject);

  return (
    <Modal
      title={`${selectedChapter?.isNew ? 'Create New' : 'Update'} Chapter for ${standardObj?.name} - ${subjectObj?.name}`}
      isOpen={isOpen}
      onClose={handleClose}
      component={
        <div>
          <TextInput
            label="Chapter Name"
            required
            value={selectedChapter.name}
            onChange={(e) => selectedChapter.setName(e.target.value)}
          />
        </div>
      }
      footer={<ModalFooter onCancel={handleClose} onSave={saveChapter} isLoading={isLoading} />}
    />
  );
});
