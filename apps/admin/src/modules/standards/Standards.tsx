import { type StandardDto } from '@repo/shared/contracts';
import { PresignedImage } from '@components/app/attachments';
import { DataTable } from '@components/app/tables';
import { Button, FullScreenLoader, TextInput } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { type IColumnData } from '@interfaces';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useSelectorStore, useStandardStore } from '@stores';
import { ACTIONS } from '@utils/constants';
import { useSetState } from 'react-use';
import { useShallow } from 'zustand/react/shallow';
import { UpsertStandardModal } from './components';

interface IState {
  isOpenCreateModal: boolean;
}

export const Standards = () => {
  const setSelectedStandardId = useSelectorStore((state) => state.setSelectedStandardId);
  // `getStandards` builds a new sorted array on every call, so the result needs a shallow compare.
  const standards = useStandardStore(useShallow((state) => state.getStandards()));
  // Derived in the store and selected here, not looked up in the formatter: selecting
  // `getSubjectsByIds` would hand back a stable function reference, so a changed mapping or a
  // renamed subject would never invalidate this component and the column would go stale.
  const subjectNamesByStandard = useStandardStore(useShallow((state) => state.getSubjectNamesByStandard()));
  const createStandard = useStandardStore((state) => state.createStandard);
  // Loads once on mount and reports the status. Nothing used to trigger this load at all: the table
  // rendered its blank state whatever the data was.
  const { isLoading } = useLoadOnce(useStandardStore, 'standards', (state) => state.loadStandards);
  const [state, setState] = useSetState<IState>({
    isOpenCreateModal: false,
  });

  const onOpenCreateModal = () => {
    setSelectedStandardId(createStandard());
    setState({ isOpenCreateModal: true });
  };

  const onOpenEditModal = (standard?: StandardDto) => {
    if (!standard) return;
    setSelectedStandardId(standard._id);
    setState({ isOpenCreateModal: true });
  };

  const onCloseCreateModal = () => {
    setState({ isOpenCreateModal: false });
  };

  const columns: IColumnData<StandardDto>[] = [
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
      // Was `row.subjects`, a view on the MST model.
      valueFormatter: (row) => subjectNamesByStandard[row._id] ?? '',
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
              placeholder="Search Standard"
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
            />
          </div>
          <div>
            <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenCreateModal}>
              Create <span className="hidden sm:inline">Standard</span>
            </Button>
          </div>
        </div>
        <div className="mt-4">
          {isLoading ? <FullScreenLoader withHeader loading /> : <DataTable rows={standards} columns={columns} />}
        </div>
      </div>
      <UpsertStandardModal isOpen={state.isOpenCreateModal} onClose={onCloseCreateModal} />
    </>
  );
};
