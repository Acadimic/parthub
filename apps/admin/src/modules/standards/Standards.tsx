import { Button, DataTable, PresignedImage, TextInput } from '@components/app';
import { IColumnData } from '@interfaces';
import { MagnifyingGlass, Pencil, Plus, Trash } from '@phosphor-icons/react';
import { IStandard, useStores } from '@stores';
import { ACTIONS } from '@utils/constants';
import { observer } from 'mobx-react-lite';
import { useSetState } from 'react-use';
import { UpsertStandardModal } from './components';

interface IState {
  isOpenCreateModal: boolean;
}

export const Standards = observer(() => {
  const { standardStore, selectorStore } = useStores();
  const { setSelectedStandardId } = selectorStore;
  const { createStandard, standards, getSubjectsByIds } = standardStore;
  const [state, setState] = useSetState<IState>({
    isOpenCreateModal: false,
  });

  const onOpenCreateModal = () => {
    createStandard();
    setState({ isOpenCreateModal: true });
  };

  const onOpenEditModal = (standard?: IStandard) => {
    if (!standard) return;
    setSelectedStandardId(standard._id);
    setState({ isOpenCreateModal: true });
  };

  const onCloseCreateModal = () => {
    setState({ isOpenCreateModal: false });
  };

  const columns: IColumnData<IStandard>[] = [
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
      label: 'Group',
      dataKey: 'group',
    },
    {
      label: 'Order',
      dataKey: 'order',
    },
    {
      label: 'Subjects',
      dataKey: 'subjects',
      valueFormatter: (row) =>
        getSubjectsByIds(row.subjects)
          .map((subject) => subject.name)
          .join(', '),
    },
    {
      label: 'Slug',
      dataKey: 'slug',
    },
    {
      label: 'Alias',
      dataKey: 'alias',
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      menuItems: [
        {
          label: 'Edit',
          onClick: onOpenEditModal,
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

  return (
    <>
      <div>
        <div className="flex justify-between items-center">
          <div className="">
            <TextInput
              placeholder="Search Standard"
              leftsection={<MagnifyingGlass weight="bold" className="w-4 h-4" />}
            />
          </div>
          <div>
            <Button leftsection={<Plus weight="bold" className="w-4 h-4" />} onClick={onOpenCreateModal}>
              Create <span className="hidden sm:inline">Standard</span>
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <DataTable rows={standards} columns={columns} />
        </div>
      </div>
      <UpsertStandardModal isOpen={state.isOpenCreateModal} onClose={onCloseCreateModal} />
    </>
  );
});
