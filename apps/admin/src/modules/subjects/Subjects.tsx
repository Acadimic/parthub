import { PresignedImage } from '@components/app/attachments';
import { DataTable } from '@components/app/tables';
import { Button, FullScreenLoader, TextInput } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { type IColumnData } from '@interfaces';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { type ISubject, useSelectorStore, useStandardStore } from '@stores';
import { ACTIONS } from '@utils/constants';
import { useSetState } from 'react-use';
import { useShallow } from 'zustand/react/shallow';
import { UpsertSubjectModal } from './components';

interface IState {
  isOpenCreateModal: boolean;
}

export const Subjects = () => {
  const setSelectedSubjectId = useSelectorStore((state) => state.setSelectedSubjectId);
  // `getSubjects` builds a new array on every call, so the result needs a shallow compare.
  const subjects = useStandardStore(useShallow((state) => state.getSubjects()));
  const createSubject = useStandardStore((state) => state.createSubject);
  // Loads once on mount and reports the status. Nothing used to trigger this load at all: the table
  // rendered its blank state whatever the data was.
  const { isLoading } = useLoadOnce(useStandardStore, 'subjects', (state) => state.loadSubjects);
  const [state, setState] = useSetState<IState>({
    isOpenCreateModal: false,
  });

  const onOpenCreateModal = () => {
    setSelectedSubjectId(createSubject());
    setState({ isOpenCreateModal: true });
  };

  const onOpenEditModal = (subject?: ISubject) => {
    if (!subject) return;
    setSelectedSubjectId(subject._id);
    setState({ isOpenCreateModal: true });
  };

  const onCloseCreateModal = () => {
    setState({ isOpenCreateModal: false });
  };

  const columns: IColumnData<ISubject>[] = [
    {
      label: 'Id',
      dataKey: '_id',
    },
    {
      label: 'Name',
      dataKey: 'name',
      component: (row) => (
        <div className="flex items-center space-x-2">
          <div>
            {row.logo ? (
              <div className="w-6 h-6 p-1 rounded-full border border-color-secondary border-dashed">
                <PresignedImage url={row.logo} />
              </div>
            ) : null}
          </div>
          <div className="flex-1 truncate">{row.name}</div>
        </div>
      ),
    },
    {
      label: 'Slug',
      dataKey: 'slug',
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
          onClick: () => {},
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
      width: 96,
    },
  ];

  return (
    <>
      <div>
        <div className="flex justify-between items-center">
          <div className="">
            <TextInput
              placeholder="Search Subject"
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
          {isLoading ? <FullScreenLoader withHeader loading /> : <DataTable rows={subjects} columns={columns} />}
        </div>
      </div>
      <UpsertSubjectModal isOpen={state.isOpenCreateModal} onClose={onCloseCreateModal} />
    </>
  );
};
