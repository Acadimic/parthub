import { UserCell } from '@components/app/avatars';
import { DataTable } from '@components/app/tables';
import { BlankState } from '@components/others';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon } from '@phosphor-icons/react';
import { Button, TextInput } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { AccountType, DefaultRole, Gender } from '@enums';
import { type IColumnData, type ISelectItem } from '@interfaces';
import { AccountStatusBadge } from '@modules/students';
import { type IUser, useSelectorLookups, useUserLookups } from '@stores';
import { ACTIONS } from '@utils/constants';
import { getStringFormattedDate, getStringFormattedDateWithTime, capitalizeFirstWord } from '@utils/helpers';
import { useMemo } from 'react';
import { useSetState } from 'react-use';
import { AddCollaboratorsModal, UpsertCollaboratorModal } from './components';

interface IState {
  isOpenUpsertCollaboratorModal: boolean;
  isOpenBulkAddCollaboratorsModal: boolean;
  isOpenAddCollaboratorsModal: boolean;
  search: string;
}

const ROLE_OPTIONS: ISelectItem[] = Object.values(DefaultRole)
  .filter((role) => role !== DefaultRole.STUDENT)
  .map((role) => ({ label: capitalizeFirstWord(role), value: role }));
const GENDER_OPTIONS: ISelectItem[] = Object.values(Gender).map((gender) => ({
  label: capitalizeFirstWord(gender),
  value: gender,
}));
const STATUS_OPTIONS: ISelectItem[] = [
  { label: 'Joined', value: AccountType.SELF },
  { label: 'Invited', value: AccountType.INVITED },
];

export const Collaborators = () => {
  const { setSelectedCollaboratorId } = useSelectorLookups();
  const userStore = useUserLookups();
  const { createCollaborator, removeNewUsers } = userStore;
  const isLoading = userStore.isLoading('users');
  const isFailed = userStore.isFailed('users');
  const collaborators = userStore.getCollaborators();
  const [state, setState] = useSetState<IState>({
    isOpenUpsertCollaboratorModal: false,
    isOpenBulkAddCollaboratorsModal: false,
    isOpenAddCollaboratorsModal: false,
    search: '',
  });

  // Saved rows only, matched against name, email and role. The search box used to have no handler.
  const visibleCollaborators = useMemo(() => {
    const saved = collaborators.filter((collaborator) => !collaborator.isNew);
    const term = state.search.trim().toLowerCase();
    if (!term) return saved;
    return saved.filter((collaborator) =>
      `${collaborator.name} ${collaborator.lastName ?? ''} ${collaborator.email} ${collaborator.designation ?? ''} ${collaborator.permission}`
        .toLowerCase()
        .includes(term),
    );
  }, [collaborators, state.search]);

  const openAddCollaboratorsModal = () => setState({ isOpenAddCollaboratorsModal: true });
  const closeAddCollaboratorsModal = () => setState({ isOpenAddCollaboratorsModal: false });

  const openBulkAddCollaboratorsModal = () => {
    setState({ isOpenBulkAddCollaboratorsModal: true, isOpenAddCollaboratorsModal: false });
  };

  const openUpsertCollaboratorModal = () => {
    // Select the draft the store just made: without this the drawer opens on nothing and the blank
    // row is left behind in the table.
    setSelectedCollaboratorId(createCollaborator(DefaultRole.TEACHER)._id);
    setState({ isOpenUpsertCollaboratorModal: true, isOpenAddCollaboratorsModal: false });
  };

  const closeUpsertCollaboratorModal = () => {
    setState({ isOpenUpsertCollaboratorModal: false });
    removeNewUsers();
  };

  const editCollaborator = (collaborator: IUser) => {
    setSelectedCollaboratorId(collaborator._id);
    setState({ isOpenUpsertCollaboratorModal: true });
  };

  const columns: IColumnData<IUser>[] = [
    {
      label: 'Collaborator',
      dataKey: 'name',
      width: 300,
      isSortable: true,
      component: (row) => <UserCell user={row} />,
    },
    {
      label: 'Role',
      dataKey: 'permission',
      width: 170,
      isSortable: true,
      filters: [{ key: 'role', label: 'Role', options: ROLE_OPTIONS, getValues: (row) => row.permission }],
      // The designation is what the person calls their job; the permission is what the app lets them do.
      valueFormatter: (row) => (
        <span className="inline-flex items-center gap-2">
          <Badge tone="neutral" appearance="soft" className="capitalize">
            {row.permission}
          </Badge>
          {row.designation ? <span className="truncate text-xs text-muted-foreground">{row.designation}</span> : null}
        </span>
      ),
    },
    {
      label: 'Gender',
      dataKey: 'gender',
      width: 110,
      filters: [{ key: 'gender', label: 'Gender', options: GENDER_OPTIONS, getValues: (row) => row.gender }],
      valueFormatter: (row) => (row.gender ? <span className="capitalize">{row.gender}</span> : ''),
    },
    {
      label: 'Status',
      dataKey: 'accountType',
      width: 120,
      filters: [{ key: 'status', label: 'Status', options: STATUS_OPTIONS, getValues: (row) => row.accountType }],
      valueFormatter: (row) => <AccountStatusBadge accountType={row.accountType} />,
    },
    {
      label: 'Added',
      dataKey: 'createdAt',
      width: 130,
      isSortable: true,
      valueFormatter: (row) => (row.createdAt ? getStringFormattedDate(row.createdAt) : ''),
    },
    {
      label: 'Last active',
      dataKey: 'lastActive',
      width: 170,
      sortValue: (row) => (row.lastActive ? String(row.lastActive) : ''),
      valueFormatter: (row) => (row.lastActive ? getStringFormattedDateWithTime(row.lastActive) : ''),
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      width: 90,
      menuItems: [
        {
          label: 'Edit',
          onClick: (row) => row && editCollaborator(row),
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
        },
      ],
    },
  ];

  const addButton = (
    <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={openAddCollaboratorsModal}>
      Add <span className="hidden sm:inline">collaborators</span>
    </Button>
  );

  const emptyState = state.search.trim() ? (
    <BlankState
      label="No matching collaborators"
      description="Try a different name, email or role."
      action={<Button isSecondary text="Clear search" onClick={() => setState({ search: '' })} />}
    />
  ) : (
    <BlankState
      label="No collaborators yet"
      description="Invite the teachers and assistants who work with you."
      action={addButton}
    />
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-72">
            <TextInput
              placeholder="Search by name, email or role"
              value={state.search}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ search: event.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              aria-label="Search collaborators"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {collaborators.length} {collaborators.length === 1 ? 'collaborator' : 'collaborators'}
            <span className="hidden md:inline"> · Filter by role, gender or status from the column headers.</span>
          </p>
          <div className="ml-auto">{addButton}</div>
        </div>
        {isFailed ? (
          <BlankState
            label="Could not load collaborators"
            description={userStore.getError('users')}
            action={<Button text="Retry" onClick={() => userStore.loadUsers()} />}
            className="rounded-lg border border-border bg-background py-10"
          />
        ) : (
          <DataTable rows={visibleCollaborators} columns={columns} isLoading={isLoading} emptyState={emptyState} />
        )}
      </div>
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
