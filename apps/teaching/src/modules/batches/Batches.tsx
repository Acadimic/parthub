import { type BatchDto } from '@repo/shared/contracts';
import { GroupAvatars } from '@components/app/avatars';
import { DataTable } from '@components/app/tables';
import { Button, FullScreenLoader, TextInput } from '@repo/ui/app';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { type IColumnData } from '@interfaces';
import { useStandardLookups, useBatchLookups, useSelectorLookups } from '@stores';
import { ACTIONS } from '@utils/constants';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { UpsertBatchModal } from './components';

interface IState {
  isOpenUpsertBatchModal: boolean;
  isLoading: boolean;
}

export const Batches = () => {
  const selectorStore = useSelectorLookups();
  const batchStore = useBatchLookups();
  const { setSelectedBatchId } = selectorStore;
  const { getStandardById } = useStandardLookups();
  const { getBatchCollaborators, getBatchStudents, loadBatchesData } = batchStore;
  const batches = batchStore.getBatches();
  const isLoadingBatchesData = batchStore.isLoading('batchesData');
  const isLoadedBatchesData = batchStore.isLoaded('batchesData');
  const [state, setState] = useSetState<IState>({
    isOpenUpsertBatchModal: false,
    isLoading: false,
  });

  const openUpsertBatchModal = () => {
    setState({ isOpenUpsertBatchModal: true });
  };

  const closeUpsertBatchModal = () => {
    setState({ isOpenUpsertBatchModal: false });
  };

  const editBatch = (batch: BatchDto) => {
    setSelectedBatchId(batch._id);
    setState({ isOpenUpsertBatchModal: true });
  };

  const onClickBatch = (_batch: BatchDto) => {};

  const columns: IColumnData<BatchDto>[] = [
    // {
    //   label: 'Id',
    //   dataKey: '_id',
    // },
    {
      label: 'Name',
      dataKey: 'name',
      valueFormatter: (row: BatchDto) => {
        return (
          <div className="cursor-pointer truncate text-blue-primary" onClick={() => onClickBatch(row)}>
            <span className="text-inherit">{row.name}</span>
          </div>
        );
      },
      // getColor: (row: BatchDto) => getRandomColor(`${row._id}`),
    },
    {
      label: 'Standard',
      dataKey: 'standard',
      valueFormatter: (row: BatchDto) => (row.standard ? getStandardById(row.standard)?.name : undefined),
    },
    {
      label: 'Students',
      dataKey: 'students',
      component: (row: BatchDto) => {
        const students = getBatchStudents(row._id);
        return (
          <div className="flex items-center justify-start">
            <GroupAvatars users={students} />
          </div>
        );
      },
    },
    {
      label: 'Collaborators',
      dataKey: 'collaborators',
      component: (row: BatchDto) => {
        const collaborators = getBatchCollaborators(row._id);
        return (
          <div className="flex items-center justify-start">
            <GroupAvatars users={collaborators} />
          </div>
        );
      },
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      menuItems: [
        {
          label: 'Edit',
          onClick: (row) => row && editBatch(row),
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
    loadBatchesData();
  }, []);

  return (
    <>
      {isLoadedBatchesData ? (
        <div>
          <div className="flex justify-between items-center">
            <div className="">
              <TextInput
                placeholder="Search Batches"
                leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              />
            </div>
            <div>
              <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={openUpsertBatchModal}>
                Add <span className="hidden sm:inline">Batches</span>
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <DataTable rows={batches} columns={columns} />
          </div>
        </div>
      ) : (
        <FullScreenLoader withHeader loading={isLoadingBatchesData} />
      )}
      <UpsertBatchModal isOpen={state.isOpenUpsertBatchModal} onClose={closeUpsertBatchModal} />
    </>
  );
};
