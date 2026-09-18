import { Button, Modal, SplitButton } from '@repo/ui/app';
import { GearIcon, PlusIcon } from '@phosphor-icons/react';
import { PositionType } from '@enums';
import { useStandardLookups, useSelectorLookups, useStandardStore, useSelectorStore } from '@stores';
import { useSetState } from 'react-use';
import { Chapters } from '../Chapters';
import { UpsertChapterModal } from './UpsertChapterModal';

interface IProps {
  standard: string;
  subject: string;
  isSecondary?: boolean;
}

interface IState {
  isOpenChapterModal: boolean;
  isOpenManageChaptersModal: boolean;
}

export const AddChapterButton = ({ standard, subject, isSecondary }: IProps) => {
  const selectorStore = useSelectorLookups();
  const { setSelectedChapterId } = selectorStore;
  const { createChapter, getStandardById, getSubjectById } = useStandardLookups();
  const [state, setState] = useSetState<IState>({
    isOpenChapterModal: false,
    isOpenManageChaptersModal: false,
  });

  const onOpenManageChaptersModal = () => {
    setState({ isOpenManageChaptersModal: true });
  };

  const onCreateChapter = () => {
    // The store used to select the draft itself; selection is the caller's job now.
    setSelectedChapterId(createChapter(standard, subject)._id);
    setState({ isOpenChapterModal: true });
  };

  const onCloseChapterModal = () => {
    setState({ isOpenChapterModal: false });
    // Read the draft at call time, not from the render closure: the save marks the chapter as no
    // longer new and then calls this, and the closure's copy still said `isNew` — so the chapter
    // the user had just created was removed from the store on the way out.
    const store = useStandardStore.getState();
    const chapter = store.getChapterById(useSelectorStore.getState().selectedChapterId);
    if (chapter?.isNew) store.removeChapterById(chapter._id);
  };

  const onCloseManageChaptersModal = () => {
    setState({ isOpenManageChaptersModal: false });
  };

  const standardObj = getStandardById(standard);
  const subjectObj = getSubjectById(subject);

  return (
    <>
      {isSecondary ? (
        <Button
          onClick={onCreateChapter}
          leftsection={<PlusIcon weight="bold" className="w-4 h-4" />}
          text="Add Chapter"
        />
      ) : (
        <>
          <SplitButton
            menuItems={[
              {
                label: 'Add Chapter',
                onClick: onCreateChapter,
                icon: <PlusIcon weight="bold" className="w-4 h-4" />,
              },
              {
                label: 'Manage Chapters',
                onClick: onOpenManageChaptersModal,
                icon: <GearIcon weight="bold" className="w-4 h-4" />,
              },
            ]}
            text="Add Chapter"
            onClick={onCreateChapter}
          />
          <Modal
            position={PositionType.RIGHT}
            title={`Manage ${standardObj?.name} - ${subjectObj?.name} Chapters`}
            isOpen={state.isOpenManageChaptersModal}
            onClose={onCloseManageChaptersModal}
            component={<Chapters standard={standard} subject={subject} />}
          />
        </>
      )}
      <UpsertChapterModal isOpen={state.isOpenChapterModal} onClose={onCloseChapterModal} />
    </>
  );
};
