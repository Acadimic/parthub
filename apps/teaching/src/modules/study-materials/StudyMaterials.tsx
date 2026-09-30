import { DataTable } from '@components/app/tables';
import { BlankState } from '@components/others';
import { MagnifyingGlassIcon, ArrowSquareOutIcon, PlusIcon, SparkleIcon, TrashIcon } from '@phosphor-icons/react';
import { Button, SoftConfirmModal, TextInput } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { type IColumnData, type IMaterialStat, type ISelectItem } from '@interfaces';
import { useMaterialStore, useSelectorStore, useStandardLookups } from '@stores';
import { ACTIONS } from '@repo/shared/utils';
import { errorToast, getStringFormattedDate, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { AddStudyMaterialModal, AiWholeMaterialDrawer } from './components';

interface IState {
  isOpenAddModal: boolean;
  isOpenAi: boolean;
  search: string;
  /** The pair whose contents the delete confirm is asking about, or `null` when it is closed. */
  statToDelete: IMaterialStat | null;
  isDeleting: boolean;
}

export const StudyMaterials = () => {
  const router = useRouter();
  const { push } = router;
  const setSelectedStandardId = useSelectorStore((state) => state.setSelectedStandardId);
  const setSelectedSubjectId = useSelectorStore((state) => state.setSelectedSubjectId);
  // A roll-up built on every call, so the selector needs a shallow compare. It is derived rather
  // than stored: `material/all` returns the materials themselves, and one row per material is what
  // this table used to show.
  const materialStats = useMaterialStore((state) => state.materialStats);
  const deleteMaterials = useMaterialStore((state) => state.deleteMaterials);
  const standardStore = useStandardLookups();
  const { getStandardById, getSubjectById } = standardStore;
  const standardOptions: ISelectItem[] = standardStore
    .getStandards()
    .map((standard) => ({ label: standard.name, value: standard._id }));
  const subjectOptions: ISelectItem[] = standardStore.getStandardsSubjectItems(
    standardOptions.map((option) => option.value),
  );
  const { isLoading, isFailed, error } = useLoadOnce(useMaterialStore, 'materialStats', (s) => s.loadMaterialStats);
  const [state, setState] = useSetState<IState>({
    isOpenAddModal: false,
    isOpenAi: false,
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

  // `?add=true` arrives from the home page's quick actions: open the picker once, then drop the
  // flag from the address so a refresh or a back navigation does not reopen it.
  useEffect(() => {
    if (router.query.add !== 'true') return;
    setState({ isOpenAddModal: true });
    router.replace(router.pathname, undefined, { shallow: true });
  }, [router.query.add]);

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
      width: 220,
      sortValue: (row) => getStandardName(row),
      filters: [{ key: 'standard', label: 'Standard', options: standardOptions, getValues: (row) => row.standard }],
      valueFormatter: (row) => <span className="font-semibold text-foreground">{getStandardName(row)}</span>,
    },
    {
      label: 'Subject',
      dataKey: 'subject',
      width: 220,
      sortValue: (row) => getSubjectName(row),
      filters: [{ key: 'subject', label: 'Subject', options: subjectOptions, getValues: (row) => row.subject }],
      valueFormatter: (row) => getSubjectName(row),
    },
    {
      label: 'Contents',
      dataKey: 'count',
      width: 120,
      align: 'right',
      isSortable: true,
      // Tabular figures: proportional digits do not line up down a numeric column.
      valueFormatter: (row) => <span className="font-mono">{row.count}</span>,
    },
    {
      label: 'Duration',
      dataKey: 'durationMins',
      width: 120,
      align: 'right',
      sortValue: (row) => row.durationMins ?? 0,
      valueFormatter: (row) => <span className="font-mono">{row.durationMins ?? 0} min</span>,
    },
    {
      label: 'Last updated',
      dataKey: 'lastUpdatedAt',
      width: 160,
      isSortable: true,
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
      width: 90,
    },
  ];

  const addButton = (
    <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenAddModal}>
      Add <span className="hidden sm:inline">study material</span>
    </Button>
  );
  const generateButton = (
    <Button
      isSecondary
      leftsection={<SparkleIcon weight="bold" className="w-4 h-4" />}
      onClick={() => setState({ isOpenAi: true })}
    >
      Generate <span className="hidden sm:inline">with AI</span>
    </Button>
  );

  const emptyState = state.search ? (
    <BlankState
      label="No matching study materials"
      description="Try a different standard or subject name."
      action={<Button isSecondary text="Clear search" onClick={() => setState({ search: '' })} />}
    />
  ) : (
    <BlankState
      label="No study materials yet"
      description="Let AI research and write a graded set of lessons for a whole standard, or pick a standard and subject to add content by hand."
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          {generateButton}
          {addButton}
        </div>
      }
    />
  );

  const deleteStandardName = state.statToDelete ? getStandardName(state.statToDelete) : '';
  const deleteSubjectName = state.statToDelete ? getSubjectName(state.statToDelete) : '';

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-72">
            <TextInput
              placeholder="Search by standard or subject"
              value={state.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ search: e.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              aria-label="Search study materials"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {materialStats.length} {materialStats.length === 1 ? 'subject' : 'subjects'}
            <span className="hidden md:inline"> · Filter by standard or subject from the column headers.</span>
          </p>
          <div className="ml-auto flex items-center gap-2">
            {generateButton}
            {addButton}
          </div>
        </div>
        {isFailed ? (
          <BlankState
            label="Could not load study materials"
            description={error ?? 'Something went wrong. Try again.'}
            action={<Button text="Retry" onClick={() => useMaterialStore.getState().loadMaterialStats()} />}
            className="rounded-lg border border-border bg-background py-10"
          />
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

      <AddStudyMaterialModal
        isOpen={state.isOpenAddModal}
        onClose={onCloseAddModal}
        handleSelect={redirectToContentPage}
      />
      <AiWholeMaterialDrawer isOpen={state.isOpenAi} onClose={() => setState({ isOpenAi: false })} />
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
