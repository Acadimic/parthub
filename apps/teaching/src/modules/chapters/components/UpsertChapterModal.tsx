import { Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { ChapterService } from '@services';
import { useStandardLookups, useStandardStore, useSelectedChapter, useSelectorLookups } from '@stores';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertChapterModal = observer(({ isOpen, onClose }: IProps) => {
  const selectorStore = useSelectorLookups();
  const standardStore = useStandardLookups();
  const { patchChapter } = standardStore;
  const { selectedChapterId } = selectorStore;
  // `selectedChapter` was an MST view over the standard store. The id still comes
  // from MST (tracked by `observer`); the row now comes from the Zustand store.
  const selectedChapter = standardStore.getChapterById(selectedChapterId);
  const [isLoading, setIsLoading] = useState(false);

  const saveChapter = async () => {
    const chapterId = selectedChapter?._id;
    if (!chapterId) return;
    try {
      setIsLoading(true);
      // Read the row back rather than posting `selectedChapter`: the store holds immutable rows, so
      // the copy captured during render does not carry an edit made after it.
      const chapter = useStandardStore.getState().getChapterById(chapterId);
      if (!chapter) return;
      await ChapterService.upsertChapter(chapter);
      useStandardStore.getState().patchChapter(chapterId, { isNew: false });
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
            onChange={(e) => patchChapter(selectedChapter._id, { name: e.target.value })}
          />
        </div>
      }
      footer={<ModalFooter onCancel={handleClose} onSave={saveChapter} isLoading={isLoading} />}
    />
  );
});
