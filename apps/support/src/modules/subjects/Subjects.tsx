import { type SubjectDto } from '@repo/shared/contracts';
import { LogoTile } from '@components/app/attachments';
import { BlankState } from '@components/others';
import { DataTable } from '@components/app/tables';
import { Button, TextInput } from '@repo/ui/app';
import { AlertDialog } from '@repo/ui/core';
import { useLoadOnce } from '@repo/ui/hooks';
import { type IColumnData } from '@interfaces';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useSelectorStore, useStandardStore } from '@stores';
import { ACTIONS } from '@repo/shared/utils';
import { errorToast, pluralize, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useSetState } from 'react-use';
import { useShallow } from 'zustand/react/shallow';
import { UpsertSubjectModal } from './components';

interface IState {
  isOpenCreateModal: boolean;
  search: string;
  /** The subject a delete has been asked for and not yet confirmed. */
  subjectToDelete?: SubjectDto;
  isDeleting: boolean;
}

export const Subjects = () => {
  const { query, replace } = useRouter();
  const setSelectedSubjectId = useSelectorStore((state) => state.setSelectedSubjectId);
  // `getSubjects` builds a new array on every call, so the result needs a shallow compare.
  const subjects = useStandardStore(useShallow((state) => state.getSubjects()));
  const standards = useStandardStore(useShallow((state) => state.getStandards()));
  const standardNamesBySubject = useStandardStore(useShallow((state) => state.getStandardNamesBySubject()));
  const standardIdsBySubject = useStandardStore(useShallow((state) => state.getStandardIdsBySubject()));
  const createSubject = useStandardStore((state) => state.createSubject);
  const deleteSubject = useStandardStore((state) => state.deleteSubject);
  const { isLoading } = useLoadOnce(useStandardStore, 'subjects', (state) => state.loadSubjects);
  const [state, setState] = useSetState<IState>({ isOpenCreateModal: false, search: '', isDeleting: false });

  const standardOptions = useMemo(
    () => standards.map((standard) => ({ label: standard.name, value: standard._id })),
    [standards],
  );

  const sortedSubjects = useMemo(() => [...subjects].sort((a, b) => a.name.localeCompare(b.name)), [subjects]);

  // Always a new array, even with no search term — see the note in `Standards`: the "Used in" cells
  // read a lookup that arrives with the mappings, and the table re-renders rows only on identity.
  const visibleSubjects = useMemo(() => {
    const term = state.search.trim().toLowerCase();
    return sortedSubjects.filter(
      (subject) =>
        !term ||
        [subject.name, subject.slug, subject.description, ...(standardNamesBySubject[subject._id] ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(term),
    );
  }, [sortedSubjects, standardNamesBySubject, state.search]);

  const onOpenCreateModal = () => {
    setSelectedSubjectId(createSubject());
    setState({ isOpenCreateModal: true });
  };

  const onOpenEditModal = (subject?: SubjectDto) => {
    if (!subject) return;
    setSelectedSubjectId(subject._id);
    setState({ isOpenCreateModal: true });
  };

  const onCloseCreateModal = () => setState({ isOpenCreateModal: false });

  // `/subjects?add=true` — the home page's "Add subject" lands with the drawer already open.
  useEffect(() => {
    if (query.add !== 'true' || isLoading) return;
    onOpenCreateModal();
    replace('/subjects', undefined, { shallow: true });
  }, [query.add, isLoading]);

  const confirmDelete = async () => {
    const subject = state.subjectToDelete;
    if (!subject || state.isDeleting) return;
    try {
      setState({ isDeleting: true });
      await deleteSubject(subject._id);
      successToast({ message: `${subject.name} deleted.` });
      setState({ subjectToDelete: undefined });
    } catch (error) {
      errorToast({ message: (error as Error)?.message || 'Could not delete the subject.' });
    } finally {
      setState({ isDeleting: false });
    }
  };

  const columns: IColumnData<SubjectDto>[] = [
    {
      label: 'Subject',
      dataKey: 'name',
      width: 300,
      isSortable: true,
      component: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <LogoTile url={row.logo} name={row.name} size="md" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-foreground">{row.name}</span>
            <span className="truncate text-xs text-muted-foreground">{row.slug}</span>
          </div>
        </div>
      ),
    },
    {
      label: 'Description',
      dataKey: 'description',
      width: 460,
      tooltipTitle: (row) => row.description ?? '',
      valueFormatter: (row) => <span className="text-muted-foreground">{row.description ?? ''}</span>,
    },
    {
      label: 'Used in',
      dataKey: 'standards',
      width: 340,
      isSortable: true,
      sortValue: (row) => (standardIdsBySubject[row._id] ?? []).length,
      filters: [
        {
          key: 'standard',
          label: 'Standard',
          options: standardOptions,
          getValues: (row) => standardIdsBySubject[row._id] ?? [],
        },
      ],
      tooltipTitle: (row) => (standardNamesBySubject[row._id] ?? []).join(', '),
      valueFormatter: (row) => {
        const names = standardNamesBySubject[row._id] ?? [];
        if (!names.length) return <span className="text-muted-foreground">Not mapped yet</span>;
        return (
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-full bg-muted px-1.5 font-mono text-xxs font-semibold text-muted-foreground">
              {names.length}
            </span>
            <span className="truncate text-muted-foreground">{names.join(', ')}</span>
          </div>
        );
      },
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      width: 80,
      menuItems: [
        { label: 'Edit', onClick: onOpenEditModal, icon: <PencilIcon weight="bold" className="w-4 h-4" /> },
        {
          label: 'Delete',
          onClick: (row) => row && setState({ subjectToDelete: row }),
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
              placeholder="Search subjects"
              value={state.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ search: e.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              aria-label="Search subjects"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {pluralize(visibleSubjects.length, 'subject')}
            <span className="hidden md:inline"> · Filter by standard from the column header.</span>
          </p>
          <div className="ml-auto">
            <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenCreateModal}>
              Create <span className="hidden sm:inline">Subject</span>
            </Button>
          </div>
        </div>
        <DataTable
          rows={visibleSubjects}
          columns={columns}
          isLoading={isLoading}
          onRowClick={onOpenEditModal}
          emptyState={
            state.search ? (
              <BlankState label="No matching subjects" description="Try a different name, description or standard." />
            ) : (
              <BlankState label="No subjects yet" description="Create your first subject to get started." />
            )
          }
        />
      </div>
      <UpsertSubjectModal isOpen={state.isOpenCreateModal} onClose={onCloseCreateModal} />
      <AlertDialog
        isOpen={!!state.subjectToDelete}
        onClose={() => !state.isDeleting && setState({ subjectToDelete: undefined })}
        onConfirm={confirmDelete}
        title={`Delete ${state.subjectToDelete?.name ?? 'subject'}?`}
        message="The subject is removed from every standard that lists it. Content already tagged with it keeps its reference."
        confirmText={state.isDeleting ? 'Deleting…' : 'Delete'}
        isDanger
      />
    </>
  );
};
