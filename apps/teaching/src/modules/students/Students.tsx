import { DataTable } from '@components/app/tables';
import { Button, FullScreenLoader, TextInput } from '@repo/ui/app';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { type IColumnData } from '@interfaces';
import { type IUser, useSelectorLookups, useUserLookups } from '@stores';
import { ACTIONS } from '@utils/constants';
import { getStringFormattedDate, getStringFormattedDateWithTime } from '@utils/helpers';
import { useSetState } from 'react-use';
import { AddStudentsModal, UpsertStudentModal } from './components';

interface IState {
  isOpenUpsertStudentModal: boolean;
  isOpenBulkAddStudentsModal: boolean;
  isOpenAddStudentsModal: boolean;
  isLoading: boolean;
}

export const Students = () => {
  const selectorStore = useSelectorLookups();
  const userStore = useUserLookups();
  const { setSelectedStudentId } = selectorStore;
  const { createStudent, getStudentStandardsByStudentId, getStudentEnrolledDateByStudentId, removeNewUsers } =
    userStore;
  const isLoadingUsers = userStore.isLoading('users');
  const students = userStore.getStudents();
  const [state, setState] = useSetState<IState>({
    isOpenUpsertStudentModal: false,
    isOpenBulkAddStudentsModal: false,
    isOpenAddStudentsModal: false,
    isLoading: false,
  });

  const openAddStudentsModal = () => {
    setState({ isOpenAddStudentsModal: true });
  };

  const openBulkAddStudentsModal = () => {
    setState({ isOpenBulkAddStudentsModal: true });
    closeAddStudentsModal();
  };

  const openUpsertStudentModal = () => {
    createStudent();
    setState({ isOpenUpsertStudentModal: true });
    closeAddStudentsModal();
  };

  const closeAddStudentsModal = () => {
    setState({ isOpenAddStudentsModal: false });
  };

  const closeUpsertStudentModal = () => {
    setState({ isOpenUpsertStudentModal: false });
    removeNewUsers();
  };

  const editStudent = (student: IUser) => {
    setSelectedStudentId(student._id);
    setState({ isOpenUpsertStudentModal: true });
  };

  const onClickStudent = (_student: IUser) => {};

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
          <div className="cursor-pointer truncate text-primary" onClick={() => onClickStudent(row)}>
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
      label: 'DOB',
      dataKey: 'dob',
      valueFormatter: (row: IUser) => row.dob && getStringFormattedDate(row.dob),
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
      label: 'Enrolled Standards',
      dataKey: 'standards',
      valueFormatter: (row: IUser) =>
        getStudentStandardsByStudentId(row._id)
          .map((standard) => standard.name)
          .join(', '),
    },
    {
      label: 'Enrolled At',
      dataKey: 'sections',
      valueFormatter: (row: IUser) => getStringFormattedDate(getStudentEnrolledDateByStudentId(row._id)),
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
          onClick: (row) => row && editStudent(row),
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
                placeholder="Search Students"
                leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              />
            </div>
            <div>
              <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={openAddStudentsModal}>
                Add <span className="hidden sm:inline">Students</span>
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <DataTable rows={students} columns={columns} />
          </div>
        </div>
      ) : (
        <FullScreenLoader withHeader loading={isLoadingUsers} />
      )}
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
