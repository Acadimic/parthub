import { type StandardDto } from '@repo/shared/contracts';
import { PresignedImage } from '@components/app/attachments';
import { BlankState } from '@components/others';
import { DataTable } from '@components/app/tables';
import { Button, FullScreenLoader, TextInput } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { type IColumnData } from '@interfaces';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon } from '@phosphor-icons/react';
import { useSelectorStore, useStandardStore } from '@stores';
import { ACTIONS } from '@utils/constants';
import { useMemo } from 'react';
import { useSetState } from 'react-use';
import { useShallow } from 'zustand/react/shallow';
import { UpsertStandardModal } from './components';

interface IState {
  isOpenCreateModal: boolean;
  search: string;
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
    search: '',
  });

  // The search box used to render with no handler at all, so typing in it did nothing. Filtering is
  // client-side because the whole collection is already in the store, and it covers the subject
  // names too, which is the column you would actually hunt through.
  const visibleStandards = useMemo(() => {
    const term = state.search.trim().toLowerCase();
    if (!term) return standards;
    return standards.filter((standard) =>
      `${standard.name} ${standard.slug} ${standard.alias ?? ''} ${subjectNamesByStandard[standard._id] ?? ''}`
        .toLowerCase()
        .includes(term),
    );
  }, [standards, subjectNamesByStandard, state.search]);

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
      width: 240,
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
      label: 'Group',
      dataKey: 'group',
      width: 170,
      // The stored values are lowercase enum members ('competitive exams'), which read as a typo in
      // a column of otherwise capitalised text.
      valueFormatter: (row) => (row.group ? <span className="capitalize">{row.group}</span> : ''),
    },
    {
      label: 'Order',
      dataKey: 'order',
      width: 100,
      // Tabular figures: proportional digits do not line up down a numeric column.
      valueFormatter: (row) => <span className="font-mono">{row.order ?? 0}</span>,
    },
    {
      label: 'Subjects',
      dataKey: 'subjects',
      width: 240,
      // Was `row.subjects`, a view on the MST model.
      valueFormatter: (row) => subjectNamesByStandard[row._id] ?? '',
    },
    {
      label: 'Slug',
      dataKey: 'slug',
      width: 200,
    },
    {
      label: 'Alias',
      dataKey: 'alias',
      width: 150,
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      // A 'Delete' item sat here with `onClick: () => {}` — it opened nothing and deleted nothing.
      // There is no delete endpoint for standards yet; restore the item with the endpoint.
      menuItems: [
        {
          label: 'Edit',
          onClick: onOpenEditModal,
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
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
              placeholder="Search Standard"
              value={state.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ search: e.target.value })}
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
          {isLoading ? (
            <FullScreenLoader withHeader loading />
          ) : (
            <DataTable
              rows={visibleStandards}
              columns={columns}
              emptyState={
                state.search ? (
                  <BlankState label="No matching standards" description="Try a different name, alias or subject." />
                ) : (
                  <BlankState label="No standards yet" description="Create your first standard to get started." />
                )
              }
            />
          )}
        </div>
      </div>
      <UpsertStandardModal isOpen={state.isOpenCreateModal} onClose={onCloseCreateModal} />
    </>
  );
};
