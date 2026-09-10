import { Button } from '@repo/ui/app';
import { PencilIcon, PlusIcon } from '@phosphor-icons/react';
import { BlankState } from '@components/others';
import { ChapterService } from '@services';
import { useStandardLookups, useSelectorLookups } from '@stores';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { UpsertChapterModal } from './components';

interface IProps {
  standard: string;
  subject: string;
}

interface IState {
  isOpenChapterModal: boolean;
}

export const Chapters = ({ standard, subject }: IProps) => {
  const selectorStore = useSelectorLookups();
  const { setSelectedChapterId, selectedChapterId } = selectorStore;
  const {
    getStandardSubjectChapters,
    createChapter,
    removeChapterById,
    getStandardById,
    getSubjectById,
    getChapterById,
  } = useStandardLookups();
  // `selectedChapter` was an MST view over the standard store. The id still comes
  // from MST (tracked by `observer`); the row now comes from the Zustand store.
  const selectedChapter = getChapterById(selectedChapterId);
  const chapters = getStandardSubjectChapters(standard, subject);
  const [state, setState] = useSetState<IState>({
    isOpenChapterModal: false,
  });

  const onEditChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setState({ isOpenChapterModal: true });
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

  useEffect(() => {
    ChapterService.getStandardSubjectChapters({ standard, subject });
  }, [standard, subject]);

  const standardObj = getStandardById(standard);
  const subjectObj = getSubjectById(subject);

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-end">
          <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onCreateChapter}>
            Add <span className="hidden sm:inline">Chapter</span>
          </Button>
        </div>
        <div>
          {chapters.map((chapter) => (
            <div
              key={chapter._id}
              className="flex items-center justify-between space-x-2 border border-border px-4 py-2 rounded"
            >
              <div>{chapter.name}</div>
              <div className="cursor-pointer" onClick={() => onEditChapter(chapter._id)}>
                <PencilIcon weight="bold" className="w-4 h-4" />
              </div>
            </div>
          ))}
          {chapters.length === 0 && (
            <div className="w-full flex justify-center items-center mt-20">
              <BlankState label={`No chapters found for ${standardObj?.name} - ${subjectObj?.name}`} />
            </div>
          )}
        </div>
      </div>
      <UpsertChapterModal isOpen={state.isOpenChapterModal} onClose={onCloseChapterModal} />
    </>
  );
};
