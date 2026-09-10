import { type TestPaperDto } from '@repo/shared/contracts';
import { Button, Menu } from '@repo/ui/app';
import { CheckIcon, CopyIcon, GitMergeIcon, PencilIcon, PlusIcon, ShareIcon, WarningIcon } from '@phosphor-icons/react';
import { useStandardLookups } from '@stores';
import { useSetState } from 'react-use';
import { MergeTestPapersModal } from './MergeTestPapersModal';

interface IProps {
  testPaper: TestPaperDto;
  addNewSection: () => void;
}

interface IState {
  isOpenMergeTestPapersModal: boolean;
}

export const TestPaperDetails = ({ testPaper, addNewSection }: IProps) => {
  const { isPublished, standards = [] } = testPaper;
  const { getStandardNamesText } = useStandardLookups();
  const [state, setState] = useSetState<IState>({
    isOpenMergeTestPapersModal: false,
  });
  const openMergeTestPapersModal = () => {
    setState({ isOpenMergeTestPapersModal: true });
  };
  const onCloseMergeTestPapersModal = () => {
    setState({ isOpenMergeTestPapersModal: false });
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
          <div>questions</div>
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
            />
          </div>
          <div className="-mr-4">
            <Menu
              menuItems={[
                {
                  label: 'Edit Paper',
                  onClick: () => {},
                  icon: <PencilIcon weight="bold" className="w-4 h-4" />,
                },
                {
                  label: 'Publish Paper',
                  onClick: () => {},
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
    </div>
  );
};
