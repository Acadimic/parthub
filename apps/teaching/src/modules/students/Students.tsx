import { UserCell } from '@components/app/avatars';
import { DataTable } from '@components/app/tables';
import { BlankState } from '@components/others';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon } from '@phosphor-icons/react';
import { Button, TextInput } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { AccountType, Gender } from '@enums';
import { type IColumnData, type ISelectItem } from '@interfaces';
import { type IUser, useSelectorLookups, useStandardLookups, useUserLookups } from '@stores';
import { ACTIONS } from '@repo/shared/utils';
import { getStringFormattedDate, getStringFormattedDateWithTime, capitalizeFirstWord } from '@utils/helpers';
import { useMemo } from 'react';
import { useSetState } from 'react-use';
import { AddStudentsModal, UpsertStudentModal } from './components';

interface IState {
  isOpenUpsertStudentModal: boolean;
  isOpenBulkAddStudentsModal: boolean;
  isOpenAddStudentsModal: boolean;
  search: string;
}

const GENDER_OPTIONS: ISelectItem[] = Object.values(Gender).map((gender) => ({
  label: capitalizeFirstWord(gender),
  value: gender,
}));
const STATUS_OPTIONS: ISelectItem[] = [
  { label: 'Joined', value: AccountType.SELF },
  { label: 'Invited', value: AccountType.INVITED },
];

/** Whether a person has signed in themselves or is still on an invitation. */
export const AccountStatusBadge = ({ accountType }: { accountType: AccountType }) =>
  accountType === AccountType.SELF ? (
    <Badge tone="success" appearance="soft" withDot>
      Joined
    </Badge>
  ) : (
    <Badge tone="warning" appearance="soft" withDot>
      Invited
    </Badge>
  );

export const Students = () => {
  const { setSelectedStudentId } = useSelectorLookups();
  const userStore = useUserLookups();
  const standardStore = useStandardLookups();
  const { createStudent, getStudentStandardsByStudentId, getStudentEnrolledDateByStudentId, removeNewUsers } =
    userStore;
  const isLoading = userStore.isLoading('users');
  const isFailed = userStore.isFailed('users');
  const students = userStore.getStudents();
  const [state, setState] = useSetState<IState>({
    isOpenUpsertStudentModal: false,
    isOpenBulkAddStudentsModal: false,
    isOpenAddStudentsModal: false,
    search: '',
  });

  const standardOptions: ISelectItem[] = standardStore
    .getStandards()
    .map((standard) => ({ label: standard.name, value: standard._id }));
  const standardNames = (student: IUser) =>
    getStudentStandardsByStudentId(student._id)
      .map((standard) => standard.name)
      .join(', ');

  // Saved rows only, and matched against what the table shows: name, email and enrolled standards.
  // The search box used to render with no handler at all.
  const visibleStudents = useMemo(() => {
    const saved = students.filter((student) => !student.isNew);
    const term = state.search.trim().toLowerCase();
    if (!term) return saved;
    return saved.filter((student) =>
      `${student.name} ${student.lastName ?? ''} ${student.email} ${standardNames(student)}`
        .toLowerCase()
        .includes(term),
    );
  }, [students, state.search, standardStore]);

  const openAddStudentsModal = () => setState({ isOpenAddStudentsModal: true });
  const closeAddStudentsModal = () => setState({ isOpenAddStudentsModal: false });

  const openBulkAddStudentsModal = () => {
    setState({ isOpenBulkAddStudentsModal: true, isOpenAddStudentsModal: false });
  };

  const openUpsertStudentModal = () => {
    // Select the draft the store just made: without this the drawer opens on nothing and the blank
    // row is left behind in the table.
    setSelectedStudentId(createStudent()._id);
    setState({ isOpenUpsertStudentModal: true, isOpenAddStudentsModal: false });
  };

  const closeUpsertStudentModal = () => {
    setState({ isOpenUpsertStudentModal: false });
    removeNewUsers();
  };

  const editStudent = (student: IUser) => {
    setSelectedStudentId(student._id);
    setState({ isOpenUpsertStudentModal: true });
  };

  const columns: IColumnData<IUser>[] = [
    {
      label: 'Student',
      dataKey: 'name',
      width: 280,
      isSortable: true,
      filters: [
        {
          key: 'standard',
          label: 'Enrolled standard',
          options: standardOptions,
          getValues: (row) => getStudentStandardsByStudentId(row._id).map((standard) => standard._id),
        },
      ],
      component: (row) => <UserCell user={row} />,
    },
    {
      label: 'Standards',
      dataKey: 'standards',
      width: 200,
      valueFormatter: (row) => standardNames(row),
    },
    {
      label: 'Gender',
      dataKey: 'gender',
      width: 110,
      filters: [{ key: 'gender', label: 'Gender', options: GENDER_OPTIONS, getValues: (row) => row.gender }],
      valueFormatter: (row) => (row.gender ? <span className="capitalize">{row.gender}</span> : ''),
    },
    {
      label: 'Date of birth',
      dataKey: 'dob',
      width: 140,
      isSortable: true,
      valueFormatter: (row) => (row.dob ? getStringFormattedDate(row.dob) : ''),
    },
    {
      label: 'Status',
      dataKey: 'accountType',
      width: 120,
      filters: [{ key: 'status', label: 'Status', options: STATUS_OPTIONS, getValues: (row) => row.accountType }],
      valueFormatter: (row) => <AccountStatusBadge accountType={row.accountType} />,
    },
    {
      label: 'Enrolled',
      dataKey: 'enrolledAt',
      width: 130,
      sortValue: (row) => getStudentEnrolledDateByStudentId(row._id),
      valueFormatter: (row) => {
        const enrolledAt = getStudentEnrolledDateByStudentId(row._id);
        return enrolledAt ? getStringFormattedDate(enrolledAt) : '';
      },
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
          onClick: (row) => row && editStudent(row),
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
        },
      ],
    },
  ];

  const addButton = (
    <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={openAddStudentsModal}>
      Add <span className="hidden sm:inline">students</span>
    </Button>
  );

  const emptyState = state.search.trim() ? (
    <BlankState
      label="No matching students"
      description="Try a different name, email or standard."
      action={<Button isSecondary text="Clear search" onClick={() => setState({ search: '' })} />}
    />
  ) : (
    <BlankState
      label="No students yet"
      description="Invite students one at a time, or upload a sheet to add a whole batch."
      action={addButton}
    />
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-72">
            <TextInput
              placeholder="Search by name, email or standard"
              value={state.search}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ search: event.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              aria-label="Search students"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {students.length} {students.length === 1 ? 'student' : 'students'}
            <span className="hidden md:inline"> · Filter by standard, gender or status from the column headers.</span>
          </p>
          <div className="ml-auto">{addButton}</div>
        </div>
        {isFailed ? (
          <BlankState
            label="Could not load students"
            description={userStore.getError('users')}
            action={<Button text="Retry" onClick={() => userStore.loadUsers()} />}
            className="rounded-lg border border-border bg-background py-10"
          />
        ) : (
          <DataTable rows={visibleStudents} columns={columns} isLoading={isLoading} emptyState={emptyState} />
        )}
      </div>
      <AddStudentsModal
        isOpen={state.isOpenAddStudentsModal}
        onClose={closeAddStudentsModal}
        openBulkAddStudentsModal={openBulkAddStudentsModal}
        openUpsertStudentModal={openUpsertStudentModal}
      />
      <UpsertStudentModal isOpen={state.isOpenUpsertStudentModal} onClose={closeUpsertStudentModal} />
    </>
  );
};
