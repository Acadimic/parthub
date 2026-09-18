import { type TestPaperDto } from '@repo/shared/contracts';
import { Button, Menu, SoftConfirmModal } from '@repo/ui/app';
import { CheckIcon, CopyIcon, GitMergeIcon, PencilIcon, PlusIcon, ShareIcon, WarningIcon } from '@phosphor-icons/react';
import { TestPaperService } from '@services';
import { useStandardLookups, useTestPaperStore } from '@stores';
import { reportError, successToast } from '@utils/helpers';
import { useSetState } from 'react-use';
import { MergeTestPapersModal } from './MergeTestPapersModal';

interface IProps {
  testPaper: TestPaperDto;
  addNewSection: () => void;
  /** Opens the paper's own edit dialog, which the detail screen owns. */
  onEditPaper: () => void;
}

interface IState {
  isOpenMergeTestPapersModal: boolean;
  isOpenPublishConfirm: boolean;
  isPublishing: boolean;
}

export const TestPaperDetails = ({ testPaper, addNewSection, onEditPaper }: IProps) => {
  const { isPublished, standards = [] } = testPaper;
  const { getStandardNamesText } = useStandardLookups();
  const addTestPapers = useTestPaperStore((state) => state.addTestPapers);
  const [state, setState] = useSetState<IState>({
    isOpenMergeTestPapersModal: false,
    isOpenPublishConfirm: false,
    isPublishing: false,
  });

  const openMergeTestPapersModal = () => {
    setState({ isOpenMergeTestPapersModal: true });
  };
  const onCloseMergeTestPapersModal = () => {
    setState({ isOpenMergeTestPapersModal: false });
  };

  const openPublishConfirm = () => {
    setState({ isOpenPublishConfirm: true });
  };

  const togglePublished = async () => {
    try {
      setState({ isPublishing: true });
      const result = await TestPaperService.upsertTestPaper({ ...testPaper, isPublished: !isPublished });
      if (result?.data) addTestPapers([result.data]);
      successToast({ message: `Test paper ${isPublished ? 'unpublished' : 'published'} successfully.` });
      setState({ isOpenPublishConfirm: false });
    } catch (error) {
      reportError(error, 'Could not change the published state.');
    } finally {
      setState({ isPublishing: false });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-center items-center gap-1">
        <div>
          <h1 className="font-semibold text-lg md:text-lg text-center">{testPaper.name}</h1>
        </div>
        <div className="text-sm font-medium">{getStandardNamesText(standards)}</div>
      </div>
      <div className="flex justify-between flex-wrap w-full text-sm font-semibold items-center gap-4">
        <div className="w-[200px] flex space-x-2">
          <div>
            <CopyIcon weight="bold" className="w-5 h-5" />
          </div>
          <div className="truncate">{testPaper.webLink}</div>
        </div>
        <div className="w-[200px] flex space-x-2">
          <div>{testPaper.totalQuestions}</div>
          <div>{testPaper.totalQuestions === 1 ? 'question' : 'questions'}</div>
        </div>
        <div className="w-[200px] flex space-x-2">
          <div>{testPaper.maxMarks}</div>
          <div>marks</div>
        </div>
        <div className="w-[200px] flex space-x-2">
          <div>{testPaper.durationMins}</div>
          <div>mins</div>{' '}
        </div>
        <div className="flex justify-between items-center w-full md:w-auto">
          <div>
            <Button
              text={isPublished ? 'Published' : 'Publish'}
              leftsection={
                isPublished ? (
                  <CheckIcon weight="bold" className="w-5 h-5 text-success" />
                ) : (
                  <WarningIcon weight="bold" className="w-5 h-5 text-warning" />
                )
              }
              isSecondary={isPublished}
              onClick={openPublishConfirm}
            />
          </div>
          <div className="-mr-4">
            <Menu
              menuItems={[
                {
                  // Both of these were `onClick: () => {}` — the items opened nothing.
                  label: 'Edit Paper',
                  onClick: onEditPaper,
                  icon: <PencilIcon weight="bold" className="w-4 h-4" />,
                },
                {
                  label: isPublished ? 'Unpublish Paper' : 'Publish Paper',
                  onClick: openPublishConfirm,
                  icon: <ShareIcon weight="bold" className="w-4 h-4" />,
                },
                {
                  label: 'Add New Section',
                  onClick: addNewSection,
                  icon: <PlusIcon weight="bold" className="w-4 h-4" />,
                },
                {
                  label: 'Merge Test Paper',
                  onClick: openMergeTestPapersModal,
                  icon: <GitMergeIcon weight="bold" className="w-4 h-4" />,
                },
              ]}
              className=""
            />
          </div>
        </div>
      </div>
      <MergeTestPapersModal
        primaryTestPaperId={testPaper._id}
        isOpen={state.isOpenMergeTestPapersModal}
        onClose={onCloseMergeTestPapersModal}
      />
      <SoftConfirmModal
        title={isPublished ? 'Unpublish Test Paper' : 'Publish Test Paper'}
        description={
          isPublished
            ? 'Unpublish this paper? Learners will no longer be able to see it.'
            : 'Publish this paper? Learners will be able to see it.'
        }
        isOpen={state.isOpenPublishConfirm}
        isLoading={state.isPublishing}
        confirmText={isPublished ? 'Unpublish' : 'Publish'}
        onCancel={() => !state.isPublishing && setState({ isOpenPublishConfirm: false })}
        onConfirm={togglePublished}
      />
    </div>
  );
};
