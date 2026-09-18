import { DataTable } from '@components/app/tables';
import { BlankState } from '@components/others';
import { MagnifyingGlassIcon, ArrowSquareOutIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { Button, SoftConfirmModal, TextInput } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { type IColumnData, type IMaterialStat } from '@interfaces';
import { useMaterialStore, useSelectorStore, useStandardLookups } from '@stores';
import { ACTIONS } from '@utils/constants';
import { errorToast, getStringFormattedDate, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useSetState } from 'react-use';
import { AddStudyMaterialModal } from './components';

interface IState {
  isOpenAddModal: boolean;
  search: string;
  /** The pair whose contents the delete confirm is asking about, or `null` when it is closed. */
  statToDelete: IMaterialStat | null;
  isDeleting: boolean;
}

export const StudyMaterials = () => {
  const { push } = useRouter();
  const setSelectedStandardId = useSelectorStore((state) => state.setSelectedStandardId);
  const setSelectedSubjectId = useSelectorStore((state) => state.setSelectedSubjectId);
  // A roll-up built on every call, so the selector needs a shallow compare. It is derived rather
  // than stored: `material/all` returns the materials themselves, and one row per material is what
  // this table used to show.
  const materialStats = useMaterialStore((state) => state.materialStats);
  const deleteMaterials = useMaterialStore((state) => state.deleteMaterials);
  const { getStandardById, getSubjectById } = useStandardLookups();
  const { isLoading, isFailed, error } = useLoadOnce(useMaterialStore, 'materialStats', (s) => s.loadMaterialStats);
  const [state, setState] = useSetState<IState>({
    isOpenAddModal: false,
    search: '',
    statToDelete: null,
    isDeleting: false,
  });

  const getStandardName = (stat: IMaterialStat) => getStandardById(stat.standard)?.name ?? '';
  const getSubjectName = (stat: IMaterialStat) => getSubjectById(stat.subject)?.name ?? '';

  // Client-side, because the whole collection is already in the store, and matched against the
  // names rather than the ids: the row holds ids, but the names are what the table shows and what
  // someone would type. Not memoised — the lookups are stable references, so a memo keyed on them
  // would keep a stale list once the standards finish loading.
  const searchTerm = state.search.trim().toLowerCase();
  const visibleStats = searchTerm
    ? materialStats.filter((stat) =>
        `${getStandardName(stat)} ${getSubjectName(stat)}`.toLowerCase().includes(searchTerm),
      )
    : materialStats;

  const onOpenAddModal = () => {
    setState({ isOpenAddModal: true });
  };

  const onCloseAddModal = () => {
    setState({ isOpenAddModal: false });
  };

  const redirectToContentPage = (standardId: string, subjectId: string) => {
    setSelectedStandardId(standardId);
    setSelectedSubjectId(subjectId);
    push(`/study-materials/${standardId}/${subjectId}`);
  };

  const openContents = (stat: IMaterialStat) => {
    redirectToContentPage(stat.standard, stat.subject);
  };

  const onCloseDeleteModal = () => {
    if (state.isDeleting) return;
    setState({ statToDelete: null });
  };

  const onConfirmDelete = async () => {
    const stat = state.statToDelete;
    if (!stat) return;
    try {
      setState({ isDeleting: true });
      const materialIds = useMaterialStore
        .getState()
        .getStandardSubjectMaterials(stat.standard, stat.subject)
        .map((material) => material._id);
      await deleteMaterials(materialIds);
      successToast({ message: `${materialIds.length} content(s) deleted successfully!` });
      setState({ statToDelete: null });
    } catch (deleteError) {
      // `callAuthApi` has already toasted an HTTP failure; anything else has no message of its own.
      if (!(deleteError instanceof Error)) errorToast({ message: 'Could not delete the contents.' });
    } finally {
      setState({ isDeleting: false });
    }
  };

  const columns: IColumnData<IMaterialStat>[] = [
    {
      label: 'Standard',
      dataKey: 'standard',
      valueFormatter: (row) => getStandardName(row),
    },
    {
      label: 'Subject',
      dataKey: 'subject',
      valueFormatter: (row) => getSubjectName(row),
    },
    {
      label: 'Contents',
      dataKey: 'count',
      width: 120,
      // Tabular figures: proportional digits do not line up down a numeric column.
      valueFormatter: (row) => <span className="font-mono">{row.count}</span>,
    },
    {
      label: 'Duration',
      dataKey: 'durationMins',
      width: 120,
      valueFormatter: (row) => <span className="font-mono">{row.durationMins ?? 0} mins</span>,
    },
    {
      label: 'Last updated',
      dataKey: 'lastUpdatedAt',
      valueFormatter: (row) => (row.lastUpdatedAt ? getStringFormattedDate(row.lastUpdatedAt) : ''),
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      menuItems: [
        {
          label: 'Open',
          onClick: (row) => row && openContents(row),
          icon: <ArrowSquareOutIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Delete all',
          onClick: (row) => row && setState({ statToDelete: row }),
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
      width: 96,
    },
  ];

  const addButton = (
    <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenAddModal}>
      Add <span className="hidden sm:inline">Study Materials</span>
    </Button>
  );

  const emptyState = state.search ? (
    <BlankState label="No matching study materials" description="Try a different standard or subject name." />
  ) : (
    <BlankState
      label="No study materials yet"
      description="Pick a standard and a subject to start adding content for your learners."
      action={addButton}
    />
  );

  const deleteStandardName = state.statToDelete ? getStandardName(state.statToDelete) : '';
  const deleteSubjectName = state.statToDelete ? getSubjectName(state.statToDelete) : '';

  return (
    <>
      <div>
        <div className="flex justify-between items-center">
          <div className="">
            <TextInput
              placeholder="Search Study Materials"
              value={state.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ search: e.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
            />
          </div>
          <div>{addButton}</div>
        </div>
        <div className="mt-4">
          {isFailed ? (
            <div className="rounded-lg border border-border bg-background py-10">
              <BlankState
                label="Could not load study materials"
                description={error ?? 'Something went wrong. Try again.'}
                action={<Button text="Retry" onClick={() => useMaterialStore.getState().loadMaterialStats()} />}
              />
            </div>
          ) : (
            <DataTable
              rows={visibleStats}
              columns={columns}
              isLoading={isLoading}
              emptyState={emptyState}
              onRowClick={openContents}
            />
          )}
        </div>
      </div>

      <AddStudyMaterialModal
        isOpen={state.isOpenAddModal}
        onClose={onCloseAddModal}
        handleSelect={redirectToContentPage}
      />
      <SoftConfirmModal
        isOpen={!!state.statToDelete}
        isDestructive
        isLoading={state.isDeleting}
        title="Delete all contents"
        description={`Every content under ${deleteStandardName} - ${deleteSubjectName} will be removed for your learners. This cannot be undone.`}
        confirmText="Delete all"
        onConfirm={onConfirmDelete}
        onCancel={onCloseDeleteModal}
      />
    </>
  );
};
