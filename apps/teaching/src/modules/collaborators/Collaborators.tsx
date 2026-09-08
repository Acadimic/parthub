import { Button, DataTable, FullScreenLoader, TextInput } from '@components/app';
import { MagnifyingGlass, Pencil, Plus, Trash } from '@phosphor-icons/react';
import { DefaultRole } from '@enums';
import { IColumnData } from '@interfaces';
import { IUser, useStores } from '@stores';
import { ACTIONS } from '@utils/constants';
import { getStringFormattedDate, getStringFormattedDateWithTime } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { useSetState } from 'react-use';
import { AddCollaboratorsModal, UpsertCollaboratorModal } from './components';

interface IState {
  isOpenUpsertCollaboratorModal: boolean;
  isOpenBulkAddCollaboratorsModal: boolean;
  isOpenAddCollaboratorsModal: boolean;
  isLoading: boolean;
}

export const Collaborators = observer(() => {
  const { push } = useRouter();
  const { selectorStore, userStore } = useStores();
  const { setSelectedCollaboratorId } = selectorStore;
  const { createCollaborator, isLoadingUsers, collaborators, removeNewUsers } = userStore;
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
    createCollaborator(DefaultRole.TEACHER);
    setState({ isOpenUpsertCollaboratorModal: true });
    closeAddCollaboratorsModal();
  };

  const closeAddCollaboratorsModal = () => {
    setState({ isOpenAddCollaboratorsModal: false });
  };

  const closeBulkAddCollaboratorsModal = () => {
    setState({ isOpenBulkAddCollaboratorsModal: false });
    removeNewUsers();
  };

  const closeUpsertCollaboratorModal = () => {
    setState({ isOpenUpsertCollaboratorModal: false });
    removeNewUsers();
  };

  const editCollaborator = (collaborator: IUser) => {
    setSelectedCollaboratorId(collaborator._id);
    setState({ isOpenUpsertCollaboratorModal: true });
  };

  const onClickCollaborator = (collaborator: IUser) => {};

  const columns: IColumnData[] = [
    // {
    //   label: 'Id',
    //   dataKey: '_id',
    // },
    {
      label: 'Name',
      dataKey: 'name',
      valueFormatter: (row: IUser) => {
        return (
          <div className="cursor-pointer truncate text-blue-primary" onClick={() => onClickCollaborator(row)}>
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
      valueFormatter: (row: IUser) => getStringFormattedDate(row.createdAt),
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
          onClick: editCollaborator,
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
      {!isLoadingUsers ? (
        <div>
          <div className="flex justify-between items-center">
            <div className="">
              <TextInput
                placeholder="Search Collaborators"
                leftsection={<MagnifyingGlass weight="bold" className="w-4 h-4" />}
              />
            </div>
            <div>
              <Button leftsection={<Plus weight="bold" className="w-4 h-4" />} onClick={openAddCollaboratorsModal}>
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
});
