import { Button, DataTable, FullScreenLoader, GroupAvatars, TextInput } from '@components/app';
import { MagnifyingGlass, Pencil, Plus, Trash } from '@phosphor-icons/react';
import { IColumnData } from '@interfaces';
import { IBatch, useStores } from '@stores';
import { ACTIONS } from '@utils/constants';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { UpsertBatchModal } from './components';

interface IState {
  isOpenUpsertBatchModal: boolean;
  isLoading: boolean;
}

export const Batches = observer(() => {
  const { push } = useRouter();
  const { selectorStore, batchStore, standardStore } = useStores();
  const { setSelectedBatchId } = selectorStore;
  const { getStandardById } = standardStore;
  const {
    batches,
    isLoadingBatchesData,
    isLoadedBatchesData,
    getBatchCollaborators,
    getBatchStudents,
    loadBatchesData,
  } = batchStore;
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

  const editBatch = (batch: IBatch) => {
    setSelectedBatchId(batch._id);
    setState({ isOpenUpsertBatchModal: true });
  };

  const onClickBatch = (batch: IBatch) => {};

  const columns: IColumnData[] = [
    // {
    //   label: 'Id',
    //   dataKey: '_id',
    // },
    {
      label: 'Name',
      dataKey: 'name',
      valueFormatter: (row: IBatch) => {
        return (
          <div className="cursor-pointer truncate text-blue-primary" onClick={() => onClickBatch(row)}>
            <span className="text-inherit">{row.name}</span>
          </div>
        );
      },
      // getColor: (row: IBatch) => getRandomColor(`${row._id}`),
    },
    {
      label: 'Standard',
      dataKey: 'standard',
      valueFormatter: (row: IBatch) => getStandardById(row.standard)?.name,
    },
    {
      label: 'Students',
      dataKey: 'students',
      component: (row: IBatch) => {
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
      component: (row: IBatch) => {
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
          onClick: editBatch,
          icon: <Pencil weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Delete',
          onClick: () => {},
          icon: <Trash weight="bold" className="w-4 h-4" />,
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
                leftsection={<MagnifyingGlass weight="bold" className="w-4 h-4" />}
              />
            </div>
            <div>
              <Button leftsection={<Plus weight="bold" className="w-4 h-4" />} onClick={openUpsertBatchModal}>
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
});
