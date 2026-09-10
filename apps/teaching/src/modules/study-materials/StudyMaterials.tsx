import { type IColumnData, type IMaterialStat } from '@interfaces';
import { DataTable } from '@components/app/tables';
import { Button, FullScreenLoader, Link, TextInput } from '@repo/ui/app';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useStandardLookups, useMaterialLookups, useSelectorLookups } from '@stores';
import { ACTIONS } from '@utils/constants';
import { getStringFormattedDate } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { AddStudyMaterialModal } from './components';

interface IState {
  isOpenAddModal: boolean;
}

export const StudyMaterials = () => {
  const { push } = useRouter();
  const materialStore = useMaterialLookups();
  const selectorStore = useSelectorLookups();
  const { setSelectedStandardId, setSelectedSubjectId } = selectorStore;
  const { materialStats, loadMaterialStats } = materialStore;
  const isLoading = materialStore.isLoading('materialStats');
  const isLoaded = materialStore.isLoaded('materialStats');
  const { getStandardById, getSubjectById } = useStandardLookups();
  const [state, setState] = useSetState<IState>({
    isOpenAddModal: false,
  });

  const onOpenAddModal = () => {
    setState({ isOpenAddModal: true });
  };

  const onCloseAddModal = () => {
    setState({ isOpenAddModal: false });
  };

  const redirectToContentPage = (standardId: string, subjectId: string) => {
    setSelectedStandardId(standardId);
    setSelectedSubjectId(subjectId);
    setTimeout(() => push(`/study-materials/${standardId}/${subjectId}`), 200);
  };

  const handleClickEditOrAddContents = (materialStat: IMaterialStat) => {
    const standardId = materialStat.standard;
    const subjectId = materialStat.subject;
    redirectToContentPage(standardId, subjectId);
  };

  const columns: IColumnData<IMaterialStat>[] = [
    {
      label: 'Standard',
      dataKey: 'standard',
      valueFormatter: (row) => {
        return (
          <Link
            isSubtle
            href={`/study-materials/${row.standard}/${row.subject}`}
            className="text-info cursor-pointer truncate"
          >
            <span className="text-info">{getStandardById(row.standard)?.name}</span>
          </Link>
        );
      },
    },
    {
      label: 'Subject',
      dataKey: 'subject',
      valueFormatter: (row) => {
        return (
          <Link
            isSubtle
            href={`/study-materials/${row.standard}/${row.subject}`}
            className="text-info cursor-pointer truncate"
          >
            <span className="text-info">{getSubjectById(row.subject)?.name}</span>
          </Link>
        );
      },
    },
    {
      label: 'Total Contents',
      dataKey: 'count',
    },
    {
      label: 'Last Updated At',
      dataKey: 'lastUpdatedAt',
      valueFormatter: (row: IMaterialStat) => getStringFormattedDate(row.lastUpdatedAt),
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      menuItems: [
        {
          label: 'Add Contents',
          onClick: (row) => row && handleClickEditOrAddContents(row),
          icon: <PlusIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Edit Contents',
          onClick: (row) => row && handleClickEditOrAddContents(row),
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Delete All',
          onClick: () => {},
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
      width: 96,
    },
  ];

  useEffect(() => {
    if (!isLoading) loadMaterialStats();
  }, []);

  return (
    <>
      {isLoaded ? (
        <div>
          <div className="flex justify-between items-center">
            <div className="">
              <TextInput
                placeholder="Search Test Paper"
                leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              />
            </div>
            <div>
              <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenAddModal}>
                Add <span className="hidden sm:inline">Study Materials</span>
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <DataTable rows={materialStats} columns={columns} />
          </div>
        </div>
      ) : (
        <FullScreenLoader withHeader loading={isLoading} />
      )}

      <AddStudyMaterialModal
        isOpen={state.isOpenAddModal}
        onClose={onCloseAddModal}
        handleSelect={redirectToContentPage}
      />
    </>
  );
};
