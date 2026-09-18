import { DataTable } from '@components/app/tables';
import { Button, FullScreenLoader, TextInput } from '@repo/ui/app';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { DefaultRole } from '@enums';
import { type IColumnData } from '@interfaces';
import { type IUser, useSelectorLookups, useUserLookups } from '@stores';
import { ACTIONS } from '@utils/constants';
import { getStringFormattedDate, getStringFormattedDateWithTime } from '@utils/helpers';
import { useSetState } from 'react-use';
import { AddCollaboratorsModal, UpsertCollaboratorModal } from './components';

interface IState {
  isOpenUpsertCollaboratorModal: boolean;
  isOpenBulkAddCollaboratorsModal: boolean;
  isOpenAddCollaboratorsModal: boolean;
  isLoading: boolean;
}

export const Collaborators = () => {
  const selectorStore = useSelectorLookups();
  const userStore = useUserLookups();
  const { setSelectedCollaboratorId } = selectorStore;
  const { createCollaborator, removeNewUsers } = userStore;
  const isLoadingUsers = userStore.isLoading('users');
  const collaborators = userStore.getCollaborators();
  const [state, setState] = useSetState<IState>({
    isOpenUpsertCollaboratorModal: false,
    isOpenBulkAddCollaboratorsModal: false,
    isOpenAddCollaboratorsModal: false,
    isLoading: false,
  });

  const openAddCollaboratorsModal = () => {
    setState({ isOpenAddCollaboratorsModal: true });
  };

  const openBulkAddCollaboratorsModal = () => {
    setState({ isOpenBulkAddCollaboratorsModal: true });
    closeAddCollaboratorsModal();
  };

  const openUpsertCollaboratorModal = () => {
    // Select the draft the store just made: without this the drawer opens on nothing and the blank
    // row is left behind in the table.
    setSelectedCollaboratorId(createCollaborator(DefaultRole.TEACHER)._id);
    setState({ isOpenUpsertCollaboratorModal: true });
    closeAddCollaboratorsModal();
  };

  const closeAddCollaboratorsModal = () => {
    setState({ isOpenAddCollaboratorsModal: false });
  };

  const closeUpsertCollaboratorModal = () => {
    setState({ isOpenUpsertCollaboratorModal: false });
    removeNewUsers();
  };

  const editCollaborator = (collaborator: IUser) => {
    setSelectedCollaboratorId(collaborator._id);
    setState({ isOpenUpsertCollaboratorModal: true });
  };

  const onClickCollaborator = (_collaborator: IUser) => {};

  const columns: IColumnData<IUser>[] = [
    // {
    //   label: 'Id',
    //   dataKey: '_id',
    // },
    {
      label: 'Name',
      dataKey: 'name',
      valueFormatter: (row: IUser) => {
        return (
          <div className="cursor-pointer truncate text-primary" onClick={() => onClickCollaborator(row)}>
            <span className="text-inherit">{row.name}</span>
          </div>
        );
      },
      // getColor: (row: IUser) => getRandomColor(`${row._id}`),
    },
    {
      label: 'Last Name',
      dataKey: 'lastName',
    },
    {
      label: 'Email',
      dataKey: 'email',
    },
    {
      label: 'Role',
      dataKey: 'designation',
      valueFormatter: (row: IUser) => {
        return (
          <div className="capitalize">
            <span className="">{row.designation}</span>
          </div>
        );
      },
    },
    {
      label: 'Gender',
      dataKey: 'gender',
      valueFormatter: (row: IUser) => {
        return (
          <div className="capitalize">
            <span className="">{row.gender}</span>
          </div>
        );
      },
    },
    {
      label: 'Invitation Status',
      dataKey: 'accountType',
      valueFormatter: (row: IUser) => {
        return (
          <div className="capitalize">
            <span className="">{row.accountType}</span>
          </div>
        );
      },
    },
    {
      label: 'Added At',
      dataKey: 'sections',
      valueFormatter: (row: IUser) => (row.createdAt ? getStringFormattedDate(row.createdAt) : ''),
    },
    {
      label: 'Last Active',
      dataKey: 'lastActive',
      valueFormatter: (row: IUser) => row.lastActive && getStringFormattedDateWithTime(row.lastActive),
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      menuItems: [
        {
          label: 'Edit',
          onClick: (row) => row && editCollaborator(row),
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
      {!isLoadingUsers ? (
        <div>
          <div className="flex justify-between items-center">
            <div className="">
              <TextInput
                placeholder="Search Collaborators"
                leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              />
            </div>
            <div>
              <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={openAddCollaboratorsModal}>
                Add <span className="hidden sm:inline">Collaborators</span>
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <DataTable rows={collaborators} columns={columns} />
          </div>
        </div>
      ) : (
        <FullScreenLoader withHeader loading={isLoadingUsers} />
      )}
      <AddCollaboratorsModal
        isOpen={state.isOpenAddCollaboratorsModal}
        onClose={closeAddCollaboratorsModal}
        openBulkAddCollaboratorsModal={openBulkAddCollaboratorsModal}
        openUpsertCollaboratorModal={openUpsertCollaboratorModal}
      />
      <UpsertCollaboratorModal isOpen={state.isOpenUpsertCollaboratorModal} onClose={closeUpsertCollaboratorModal} />
    </>
  );
};
