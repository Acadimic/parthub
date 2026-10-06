import { useLoadOnce } from '@repo/ui/hooks';
import { type BatchDto } from '@repo/shared/contracts';
import { GroupAvatars } from '@components/app/avatars';
import { DataTable } from '@components/app/tables';
import { BlankState } from '@components/others';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon } from '@phosphor-icons/react';
import { Button, TextInput } from '@repo/ui/app';
import { type IColumnData, type ISelectItem } from '@interfaces';
import { useBatchLookups, useSelectorLookups, useStandardLookups, useUserStore } from '@stores';
import { ACTIONS } from '@repo/shared/utils';
import { useEffect, useMemo } from 'react';
import { useSetState } from 'react-use';
import { UpsertBatchModal } from './components';

interface IState {
  isOpenUpsertBatchModal: boolean;
  search: string;
}

/** People in a batch: their avatars and, next to them, how many there are. */
const People = ({ users }: { users: ReturnType<ReturnType<typeof useBatchLookups>['getBatchStudents']> }) =>
  users.length ? (
    <div className="flex items-center gap-2">
      <GroupAvatars users={users} max={3} />
      <span className="font-mono text-xs text-muted-foreground">{users.length}</span>
    </div>
  ) : (
    <span className="text-muted-foreground">—</span>
  );

export const Batches = () => {
  // The org's people are loaded by each screen that shows them; nothing loads them up front.
  useLoadOnce(useUserStore, 'users', (state) => state.loadUsers);
  const { setSelectedBatchId, removeSelectedBatchId } = useSelectorLookups();
  const batchStore = useBatchLookups();
  const standardStore = useStandardLookups();
  const { getStandardById } = standardStore;
  const { getBatchCollaborators, getBatchStudents, loadBatchesData } = batchStore;
  const batches = batchStore.getBatches();
  const isLoading = batchStore.isLoading('batchesData') && !batchStore.isLoaded('batchesData');
  const isFailed = batchStore.isFailed('batchesData');
  const [state, setState] = useSetState<IState>({ isOpenUpsertBatchModal: false, search: '' });

  const standardOptions: ISelectItem[] = standardStore
    .getStandards()
    .map((standard) => ({ label: standard.name, value: standard._id }));
  const standardName = (batch: BatchDto) => (batch.standard ? (getStandardById(batch.standard)?.name ?? '') : '');

  // Saved rows only, matched against name, standard and year. The search box used to have no handler.
  const visibleBatches = useMemo(() => {
    const saved = batches.filter((batch) => !batch.isNew);
    const term = state.search.trim().toLowerCase();
    if (!term) return saved;
    return saved.filter((batch) => `${batch.name} ${standardName(batch)} ${batch.year}`.toLowerCase().includes(term));
  }, [batches, state.search, standardStore]);

  const openUpsertBatchModal = () => {
    removeSelectedBatchId();
    setState({ isOpenUpsertBatchModal: true });
  };

  const closeUpsertBatchModal = () => setState({ isOpenUpsertBatchModal: false });

  const editBatch = (batch: BatchDto) => {
    setSelectedBatchId(batch._id);
    setState({ isOpenUpsertBatchModal: true });
  };

  const columns: IColumnData<BatchDto>[] = [
    {
      label: 'Batch',
      dataKey: 'name',
      width: 260,
      isSortable: true,
      filters: [{ key: 'standard', label: 'Standard', options: standardOptions, getValues: (row) => row.standard }],
      valueFormatter: (row) => <span className="font-semibold text-foreground">{row.name}</span>,
    },
    {
      label: 'Standard',
      dataKey: 'standard',
      width: 200,
      sortValue: standardName,
      valueFormatter: standardName,
    },
    {
      label: 'Year',
      dataKey: 'year',
      width: 110,
      isSortable: true,
      filters: [{ key: 'year', label: 'Year', getValues: (row) => row.year }],
      valueFormatter: (row) => <span className="font-mono">{row.year}</span>,
    },
    {
      label: 'Students',
      dataKey: 'students',
      width: 180,
      sortValue: (row) => getBatchStudents(row._id).length,
      component: (row) => <People users={getBatchStudents(row._id)} />,
    },
    {
      label: 'Collaborators',
      dataKey: 'collaborators',
      width: 180,
      sortValue: (row) => getBatchCollaborators(row._id).length,
      component: (row) => <People users={getBatchCollaborators(row._id)} />,
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      width: 90,
      menuItems: [
        {
          label: 'Edit',
          onClick: (row) => row && editBatch(row),
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
        },
      ],
    },
  ];

  useEffect(() => {
    loadBatchesData();
  }, []);

  const addButton = (
    <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={openUpsertBatchModal}>
      Add <span className="hidden sm:inline">batch</span>
    </Button>
  );

  const emptyState = state.search.trim() ? (
    <BlankState
      label="No matching batches"
      description="Try a different name, standard or year."
      action={<Button isSecondary text="Clear search" onClick={() => setState({ search: '' })} />}
    />
  ) : (
    <BlankState
      label="No batches yet"
      description="A batch groups the students and collaborators who learn together."
      action={addButton}
    />
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-72">
            <TextInput
              placeholder="Search by name, standard or year"
              value={state.search}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ search: event.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              aria-label="Search batches"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
            <span className="hidden md:inline"> · Filter by standard or year from the column headers.</span>
          </p>
          <div className="ml-auto">{addButton}</div>
        </div>
        {isFailed ? (
          <BlankState
            label="Could not load batches"
            description={batchStore.getError('batchesData')}
            action={<Button text="Retry" onClick={() => loadBatchesData()} />}
            className="rounded-lg border border-border bg-background py-10"
          />
        ) : (
          <DataTable rows={visibleBatches} columns={columns} isLoading={isLoading} emptyState={emptyState} />
        )}
      </div>
      <UpsertBatchModal isOpen={state.isOpenUpsertBatchModal} onClose={closeUpsertBatchModal} />
    </>
  );
};
