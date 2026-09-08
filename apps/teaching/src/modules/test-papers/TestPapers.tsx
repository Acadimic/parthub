import { type IColumnData } from '@interfaces';
import { DataTable } from '@components/app/tables';
import { Button, FullScreenLoader, Link, TextInput } from '@repo/ui/app';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { type ITestPaper, useStores } from '@stores';
import { ACTIONS } from '@utils/constants';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { CreateTestPaperModal } from './components';

interface IState {
  isOpenCreateModal: boolean;
}

export const TestPapers = observer(() => {
  const { push } = useRouter();
  const { testPaperStore, selectorStore, standardStore } = useStores();
  const { setSelectedTestPaperId, setSelectedTestPaperSectionId, selectedTestPaper } = selectorStore;
  const { isLoadingTestPapers, createTestPaper, testPapers, loadTestPapers, isLoadedTestPapers } = testPaperStore;
  const { getStandardsByIds, getSubjectsByIds } = standardStore;
  const [state, setState] = useSetState<IState>({
    isOpenCreateModal: false,
  });

  const onOpenCreateModal = () => {
    createTestPaper();
    setState({ isOpenCreateModal: true });
  };

  const onOpenEditModal = (testPaper: ITestPaper) => {
    setSelectedTestPaperId(testPaper._id);
    setState({ isOpenCreateModal: true });
  };

  const onCloseCreateModal = () => {
    setState({ isOpenCreateModal: false });
  };

  const onClickTestPaper = (testPaper: ITestPaper) => {
    setSelectedTestPaperId(testPaper._id);
    setSelectedTestPaperSectionId(testPaper.sections[0]);
    setTimeout(() => {
      push(
        { pathname: `/test-papers/${testPaper._id}`, query: { name: testPaper.name } },
        `/test-papers/${testPaper._id}`,
      );
    }, 200);
  };

  const columns: IColumnData<ITestPaper>[] = [
    // {
    //   label: 'Id',
    //   dataKey: '_id',
    // },
    {
      label: 'Name',
      dataKey: 'name',
      valueFormatter: (row: ITestPaper) => {
        return (
          <Link href={`/test-papers/${row._id}`} isSubtle className="px-0">
            <span className="text-blue-primary">{row.name}</span>
          </Link>
        );
      },
    },
    {
      label: 'Standards',
      dataKey: 'standards',
      valueFormatter: (row) =>
        getStandardsByIds(row.standards)
          .map((standard) => standard.name)
          .join(', '),
    },
    {
      label: 'Subjects',
      dataKey: 'subjects',
      valueFormatter: (row) =>
        getSubjectsByIds(row.subjects)
          .map((subject) => subject.name)
          .join(', '),
    },
    {
      label: 'Total Sections',
      dataKey: 'sections',
      valueFormatter: (row) => row.sections.length,
    },
    {
      label: 'Total Questions',
      dataKey: 'totalQuestions',
    },
    {
      label: 'Duration (Mins)',
      dataKey: 'durationMins',
    },
    {
      label: 'Max Marks',
      dataKey: 'maxMarks',
    },
    {
      label: 'Year',
      dataKey: 'year',
    },
    {
      label: 'Paper Type',
      dataKey: 'paperType',
    },
    {
      label: 'Paper Section',
      dataKey: 'paperSection',
    },
    {
      label: 'Web Link',
      dataKey: 'webLink',
    },
    {
      label: 'Is Published',
      dataKey: 'isPublished',
      valueFormatter: (row) => (row.isPublished ? 'Yes' : 'No'),
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      menuItems: [
        {
          label: 'Add Questions',
          onClick: (row) => row && onClickTestPaper(row),
          icon: <PlusIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Edit Details',
          onClick: (row) => row && onOpenEditModal(row),
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Delete',
          onClick: () => {},
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
      width: 96,
    },
  ];

  useEffect(() => {
    if (!isLoadingTestPapers) loadTestPapers();
  }, []);

  return (
    <>
      {isLoadedTestPapers ? (
        <div>
          <div className="flex justify-between items-center">
            <div className="">
              <TextInput
                placeholder="Search Test Paper"
                leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              />
            </div>
            <div>
              <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenCreateModal}>
                Create <span className="hidden sm:inline">Test Paper</span>
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <DataTable rows={testPapers} columns={columns} />
          </div>
        </div>
      ) : (
        <FullScreenLoader withHeader loading={isLoadingTestPapers} />
      )}

      {selectedTestPaper && <CreateTestPaperModal isOpen={state.isOpenCreateModal} onClose={onCloseCreateModal} />}
    </>
  );
});
