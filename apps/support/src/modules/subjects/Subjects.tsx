import { type SubjectDto } from '@repo/shared/contracts';
import { PresignedImage } from '@components/app/attachments';
import { BlankState } from '@components/others';
import { DataTable } from '@components/app/tables';
import { Button, FullScreenLoader, TextInput } from '@repo/ui/app';
import { AlertDialog } from '@repo/ui/core';
import { useLoadOnce } from '@repo/ui/hooks';
import { type IColumnData } from '@interfaces';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useSelectorStore, useStandardStore } from '@stores';
import { ACTIONS } from '@utils/constants';
import { errorToast, successToast } from '@utils/helpers';
import { useMemo } from 'react';
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
  const setSelectedSubjectId = useSelectorStore((state) => state.setSelectedSubjectId);
  // `getSubjects` builds a new array on every call, so the result needs a shallow compare.
  const subjects = useStandardStore(useShallow((state) => state.getSubjects()));
  const createSubject = useStandardStore((state) => state.createSubject);
  const deleteSubject = useStandardStore((state) => state.deleteSubject);
  // Loads once on mount and reports the status. Nothing used to trigger this load at all: the table
  // rendered its blank state whatever the data was.
  const { isLoading } = useLoadOnce(useStandardStore, 'subjects', (state) => state.loadSubjects);
  const [state, setState] = useSetState<IState>({
    isOpenCreateModal: false,
    search: '',
    isDeleting: false,
  });

  // The search box used to render with no handler at all, so typing in it did nothing. Filtering is
  // client-side because the whole collection is already in the store.
  const visibleSubjects = useMemo(() => {
    const term = state.search.trim().toLowerCase();
    if (!term) return subjects;
    return subjects.filter((subject) =>
      `${subject.name} ${subject.slug} ${subject.description ?? ''}`.toLowerCase().includes(term),
    );
  }, [subjects, state.search]);

  const onOpenCreateModal = () => {
    setSelectedSubjectId(createSubject());
    setState({ isOpenCreateModal: true });
  };

  const onOpenEditModal = (subject?: SubjectDto) => {
    if (!subject) return;
    setSelectedSubjectId(subject._id);
    setState({ isOpenCreateModal: true });
  };

  const onCloseCreateModal = () => {
    setState({ isOpenCreateModal: false });
  };

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
      label: 'Name',
      width: 300,
      dataKey: 'name',
      component: (row) => (
        <div className="flex items-center space-x-2">
          <div>
            {row.logo ? (
              <div className="w-6 h-6 p-1 rounded-full border border-border border-dashed">
                <PresignedImage url={row.logo} />
              </div>
            ) : null}
          </div>
          <div className="flex-1 truncate">{row.name}</div>
        </div>
      ),
    },
    {
      label: 'Description',
      dataKey: 'description',
      width: 420,
      valueFormatter: (row) => (
        <span className="block truncate text-muted-foreground" title={row.description ?? ''}>
          {row.description ?? ''}
        </span>
      ),
    },
    {
      label: 'Slug',
      dataKey: 'slug',
      width: 260,
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      menuItems: [
        {
          label: 'Edit',
          onClick: onOpenEditModal,
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Delete',
          onClick: (row) => row && setState({ subjectToDelete: row }),
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
      width: 90,
    },
  ];

  return (
    <>
      <div>
        <div className="flex justify-between items-center">
          <div className="">
            <TextInput
              placeholder="Search Subject"
              value={state.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ search: e.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
            />
          </div>
          <div>
            <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenCreateModal}>
              Create <span className="hidden sm:inline">Subject</span>
            </Button>
          </div>
        </div>
        <div className="mt-4">
          {isLoading ? (
            <FullScreenLoader withHeader loading />
          ) : (
            <DataTable
              rows={visibleSubjects}
              columns={columns}
              emptyState={
                state.search ? (
                  <BlankState label="No matching subjects" description="Try a different name or slug." />
                ) : (
                  <BlankState label="No subjects yet" description="Create your first subject to get started." />
                )
              }
            />
          )}
        </div>
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
