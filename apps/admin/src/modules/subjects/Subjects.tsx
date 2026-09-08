import { PresignedImage } from '@components/app/attachments';
import { DataTable } from '@components/app/tables';
import { Button, TextInput } from '@repo/ui/app';
import { type IColumnData } from '@interfaces';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { type ISubject, useStores } from '@stores';
import { ACTIONS } from '@utils/constants';
import { observer } from 'mobx-react-lite';
import { useSetState } from 'react-use';
import { UpsertSubjectModal } from './components';

interface IState {
  isOpenCreateModal: boolean;
}

export const Subjects = observer(() => {
  const { standardStore, selectorStore } = useStores();
  const { setSelectedSubjectId } = selectorStore;
  const { createSubject, subjects } = standardStore;
  const [state, setState] = useSetState<IState>({
    isOpenCreateModal: false,
  });

  const onOpenCreateModal = () => {
    createSubject();
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
          <DataTable rows={subjects} columns={columns} />
        </div>
      </div>
      <UpsertSubjectModal isOpen={state.isOpenCreateModal} onClose={onCloseCreateModal} />
    </>
  );
});
