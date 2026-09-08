import { Button, Menu } from '@components/app';
import { CheckIcon, CopyIcon, GitMergeIcon, PencilIcon, PlusIcon, ShareIcon, WarningIcon } from '@phosphor-icons/react';
import { ITestPaper, useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useSetState } from 'react-use';
import { MergeTestPapersModal } from './MergeTestPapersModal';

interface IProps {
  testPaper: ITestPaper;
  addNewSection: () => void;
}

interface IState {
  isOpenMergeTestPapersModal: boolean;
}

export const TestPaperDetails = observer(({ testPaper, addNewSection }: IProps) => {
  const { standardStore } = useStores();
  const { isPublished, standards } = testPaper;
  const { getStandardsByIds } = standardStore;
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
        <div className="text-sm font-medium">
          {getStandardsByIds(standards)
            .map((standard) => standard.name)
            .join(', ')}
        </div>
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
                  <CheckIcon weight="bold" className="w-5 h-5 text-green-primary" />
                ) : (
                  <WarningIcon weight="bold" className="w-5 h-5 text-yellow-primary" />
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
});
