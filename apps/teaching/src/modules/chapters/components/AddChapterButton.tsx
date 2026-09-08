import { Button, Modal, SplitButton } from '@repo/ui/app';
import { GearIcon, PlusIcon } from '@phosphor-icons/react';
import { PositionType } from '@enums';
import { useStandardLookups, useSelectorLookups } from '@stores';
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
  const { selectedChapterId, setSelectedChapterId } = selectorStore;
  const { createChapter, removeChapterById, getStandardById, getSubjectById, getChapterById } = useStandardLookups();
  // `selectedChapter` was an MST view over the standard store. The id still comes
  // from MST (tracked by `observer`); the row now comes from the Zustand store.
  const selectedChapter = getChapterById(selectedChapterId);
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
    if (selectedChapter?.isNew) removeChapterById(selectedChapter._id);
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
