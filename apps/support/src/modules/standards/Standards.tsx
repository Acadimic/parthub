import { type StandardDto } from '@repo/shared/contracts';
import { StandardGroup } from '@enums';
import { LogoTile } from '@components/app/attachments';
import { BlankState } from '@components/others';
import { DataTable } from '@components/app/tables';
import { Button, TextInput } from '@repo/ui/app';
import { AlertDialog, Badge } from '@repo/ui/core';
import { useLoadOnce } from '@repo/ui/hooks';
import { type IColumnData } from '@interfaces';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useSelectorStore, useStandardStore } from '@stores';
import { ACTIONS } from '@repo/shared/utils';
import { errorToast, pluralize, successToast, titleCase } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useSetState } from 'react-use';
import { useShallow } from 'zustand/react/shallow';
import { UpsertStandardModal } from './components';

interface IState {
  isOpenCreateModal: boolean;
  search: string;
  /** The standard a delete has been asked for and not yet confirmed. */
  standardToDelete?: StandardDto;
  isDeleting: boolean;
}

const GROUP_OPTIONS = Object.values(StandardGroup).map((group) => ({ label: titleCase(group), value: group }));

/** A count pill followed by the names, for a cell that lists a standard's subjects or references. */
const NameList = ({ names }: { names: string[] }) => {
  if (!names.length) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 rounded-full bg-muted px-1.5 font-mono text-xxs font-semibold text-muted-foreground">
        {names.length}
      </span>
      <span className="truncate text-muted-foreground">{names.join(', ')}</span>
    </div>
  );
};

export const Standards = () => {
  const { query, replace } = useRouter();
  const setSelectedStandardId = useSelectorStore((state) => state.setSelectedStandardId);
  // `getStandards` builds a new sorted array on every call, so the result needs a shallow compare.
  const standards = useStandardStore(useShallow((state) => state.getStandards()));
  const subjects = useStandardStore(useShallow((state) => state.getSubjects()));
  // Derived in the store and selected here, not looked up in the formatter: selecting a lookup
  // function would hand back a stable reference, so a changed mapping or a renamed subject would
  // never invalidate this component and the column would go stale.
  const subjectNamesByStandard = useStandardStore(useShallow((state) => state.getSubjectNamesByStandard()));
  const subjectIdsByStandard = useStandardStore(useShallow((state) => state.getSubjectIdsByStandard()));
  const referenceNamesByStandard = useStandardStore(useShallow((state) => state.getReferenceStandardNamesByStandard()));
  const createStandard = useStandardStore((state) => state.createStandard);
  const deleteStandard = useStandardStore((state) => state.deleteStandard);
  const { isLoading } = useLoadOnce(useStandardStore, 'standards', (state) => state.loadStandards);
  const [state, setState] = useSetState<IState>({ isOpenCreateModal: false, search: '', isDeleting: false });

  const subjectOptions = useMemo(
    () => subjects.map((subject) => ({ label: subject.name, value: subject._id })),
    [subjects],
  );

  // Client-side, because the whole collection is already in the store. Covers the subject names and
  // the description too, which is what you actually hunt through.
  //
  // Always a new array, even with no search term: the table re-renders its virtualised rows only
  // when `rows` changes identity, and the Subjects and References cells read lookups that arrive
  // with the mappings, sometimes after the standards. Without this the cells stayed "—" until the
  // next interaction.
  const visibleStandards = useMemo(() => {
    const term = state.search.trim().toLowerCase();
    return standards.filter(
      (standard) =>
        !term ||
        [
          standard.name,
          standard.slug,
          standard.alias,
          standard.description,
          ...(subjectNamesByStandard[standard._id] ?? []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(term),
    );
  }, [standards, subjectNamesByStandard, referenceNamesByStandard, state.search]);

  const onOpenCreateModal = () => {
    setSelectedStandardId(createStandard());
    setState({ isOpenCreateModal: true });
  };

  const onOpenEditModal = (standard?: StandardDto) => {
    if (!standard) return;
    setSelectedStandardId(standard._id);
    setState({ isOpenCreateModal: true });
  };

  const onCloseCreateModal = () => setState({ isOpenCreateModal: false });

  // `/standards?add=true` — the home page's "Add standard" lands with the drawer already open.
  useEffect(() => {
    if (query.add !== 'true' || isLoading) return;
    onOpenCreateModal();
    replace('/standards', undefined, { shallow: true });
  }, [query.add, isLoading]);

  const confirmDelete = async () => {
    const standard = state.standardToDelete;
    if (!standard || state.isDeleting) return;
    try {
      setState({ isDeleting: true });
      await deleteStandard(standard._id);
      successToast({ message: `${standard.name} deleted.` });
      setState({ standardToDelete: undefined });
    } catch (error) {
      errorToast({ message: (error as Error)?.message || 'Could not delete the standard.' });
    } finally {
      setState({ isDeleting: false });
    }
  };

  const columns: IColumnData<StandardDto>[] = [
    {
      label: 'Standard',
      dataKey: 'name',
      width: 300,
      isSortable: true,
      component: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <LogoTile url={row.logo} name={row.name} size="md" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-foreground">{row.name}</span>
            <span className="truncate text-xs text-muted-foreground">{row.alias || row.slug}</span>
          </div>
        </div>
      ),
    },
    {
      label: 'Group',
      dataKey: 'group',
      width: 170,
      isSortable: true,
      filters: [{ key: 'group', label: 'Group', options: GROUP_OPTIONS, getValues: (row) => row.group }],
      valueFormatter: (row) => (row.group ? <Badge className="capitalize">{row.group}</Badge> : ''),
    },
    {
      label: 'Order',
      dataKey: 'order',
      width: 100,
      align: 'right',
      isSortable: true,
      // Tabular figures: proportional digits do not line up down a numeric column.
      valueFormatter: (row) => <span className="font-mono">{row.order ?? 0}</span>,
    },
    {
      label: 'Subjects',
      dataKey: 'subjects',
      width: 300,
      isSortable: true,
      sortValue: (row) => (subjectIdsByStandard[row._id] ?? []).length,
      filters: [
        {
          key: 'subject',
          label: 'Subject',
          options: subjectOptions,
          getValues: (row) => subjectIdsByStandard[row._id] ?? [],
        },
      ],
      tooltipTitle: (row) => (subjectNamesByStandard[row._id] ?? []).join(', '),
      valueFormatter: (row) => <NameList names={subjectNamesByStandard[row._id] ?? []} />,
    },
    {
      label: 'Description',
      dataKey: 'description',
      width: 300,
      tooltipTitle: (row) => row.description ?? '',
      valueFormatter: (row) => <span className="text-muted-foreground">{row.description ?? ''}</span>,
    },
    {
      label: 'References',
      dataKey: 'references',
      width: 200,
      tooltipTitle: (row) => (referenceNamesByStandard[row._id] ?? []).join(', '),
      valueFormatter: (row) => <NameList names={referenceNamesByStandard[row._id] ?? []} />,
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      width: 80,
      menuItems: [
        { label: 'Edit', onClick: onOpenEditModal, icon: <PencilIcon weight="bold" className="w-4 h-4" /> },
        {
          label: 'Delete',
          // Asks first: the delete is soft on the server, but it also removes every subject mapping
          // of the standard, which the dialog message says.
          onClick: (row) => row && setState({ standardToDelete: row }),
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-72">
            <TextInput
              placeholder="Search standards"
              value={state.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ search: e.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              aria-label="Search standards"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {pluralize(visibleStandards.length, 'standard')}
            <span className="hidden md:inline"> · Filter by group or subject from the column headers.</span>
          </p>
          <div className="ml-auto">
            <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenCreateModal}>
              Create <span className="hidden sm:inline">Standard</span>
            </Button>
          </div>
        </div>
        <DataTable
          rows={visibleStandards}
          columns={columns}
          isLoading={isLoading}
          onRowClick={onOpenEditModal}
          emptyState={
            state.search ? (
              <BlankState
                label="No matching standards"
                description="Try a different name, alias, subject or description."
              />
            ) : (
              <BlankState label="No standards yet" description="Create your first standard to get started." />
            )
          }
        />
      </div>
      <UpsertStandardModal isOpen={state.isOpenCreateModal} onClose={onCloseCreateModal} />
      <AlertDialog
        isOpen={!!state.standardToDelete}
        onClose={() => !state.isDeleting && setState({ standardToDelete: undefined })}
        onConfirm={confirmDelete}
        title={`Delete ${state.standardToDelete?.name ?? 'standard'}?`}
        message="The standard and its subject mappings are removed from every app. Content already tagged with it keeps its reference."
        confirmText={state.isDeleting ? 'Deleting…' : 'Delete'}
        isDanger
      />
    </>
  );
};
