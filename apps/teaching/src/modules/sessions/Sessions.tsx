import { type MeetDto } from '@repo/shared/contracts';
import { DataTable } from '@components/app/tables';
import { Button, FullScreenLoader, TextInput, Tooltip } from '@repo/ui/app';
import { CopyUrl } from '@components/common';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { type IColumnData } from '@interfaces';
import {
  JoiningLink,
  MeetingOverviewModal,
  MeetingTitle,
  UpsertMeetingModal,
  ViewMeetAttendees,
} from '@modules/calender/components';
import { useMeetHooks } from '@modules/calender/hooks';
import { useMeetLookups } from '@stores';
import { ACTIONS } from '@utils/constants';
import {
  addDaysToDate,
  getFormattedTime,
  getFrequencyText,
  getFullCalendarEvents,
  getFullFormattedDate,
  splitCamelCase,
} from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const Sessions = () => {
  const { push } = useRouter();
  const meetStore = useMeetLookups();
  const { loadMeets } = meetStore;
  const meets = meetStore.getMeets();
  const isLoadingMeets = meetStore.isLoading('meets');
  const isLoadedMeets = meetStore.isLoaded('meets');
  const {
    state,
    handleCreateMeet,
    openUpsertMeetingModal,
    closeUpsertMeetingModal,
    closeMeetingOverviewModal,
    handleEditMeet,
  } = useMeetHooks();

  const onClickSession = (_session: MeetDto) => {
    push(`/calender`);
  };

  const columns: IColumnData<MeetDto>[] = [
    // {
    //   label: 'Id',
    //   dataKey: '_id',
    // },
    {
      label: 'Name',
      dataKey: 'name',
      valueFormatter: (row: MeetDto) => {
        return (
          <div className="cursor-pointer text-primary" onClick={() => onClickSession(row)}>
            <MeetingTitle meet={row} />
          </div>
        );
      },
    },

    {
      label: 'Date and Time',
      dataKey: 'date',
      component: (row: MeetDto) => {
        const events = getFullCalendarEvents(row, new Date(), addDaysToDate(new Date(), 15));
        const nextEvent = events[0];
        return (
          <Tooltip>
            {nextEvent ? (
              <>
                <div className="truncate w-full">{getFullFormattedDate(nextEvent.start)}</div>
                <div className="truncate w-full">{`${getFormattedTime(nextEvent.start)} - ${getFormattedTime(nextEvent.end)}`}</div>
              </>
            ) : (
              <>
                <div className="truncate w-full">{row.startTime ? getFullFormattedDate(row.startTime) : ''}</div>
                <div className="truncate w-full">
                  {row.startTime && row.endTime
                    ? `${getFormattedTime(row.startTime)} - ${getFormattedTime(row.endTime)}`
                    : ''}
                </div>
              </>
            )}
          </Tooltip>
        );
      },
    },

    {
      label: 'Repeat On',
      dataKey: 'frequencyText',
      component: (row: MeetDto) => {
        const frequency = row.startTime ? getFrequencyText([...(row.weekDays ?? [])], row.startTime) : '';
        return (
          <Tooltip title={frequency}>
            <div className="truncate w-full">{frequency}</div>
          </Tooltip>
        );
      },
    },

    {
      label: 'Teachers',
      dataKey: 'teachers',
      component: (row: MeetDto) => {
        return <ViewMeetAttendees attendeeIds={row.attendees ?? []} isTeachers noLabel />;
      },
    },

    {
      label: 'Students',
      dataKey: 'students',
      component: (row: MeetDto) => {
        return <ViewMeetAttendees attendeeIds={row.attendees ?? []} isStudents noLabel />;
      },
    },

    {
      label: 'Join',
      dataKey: 'join',
      component: (row: MeetDto) => {
        return (
          <div className="flex flex-col gap-2 w-full">
            <JoiningLink url={row.meetingLink ?? ''} />
            <CopyUrl url={row.meetingLink ?? ''} />
          </div>
        );
      },
    },

    {
      label: 'Frequency',
      dataKey: 'frequency',
      component: (row: MeetDto) => {
        return <div className="capitalize">{splitCamelCase(row.frequency)}</div>;
      },
    },

    {
      label: 'Duration (mins)',
      dataKey: 'durationMins',
    },

    {
      label: 'Actions',
      dataKey: ACTIONS,
      menuItems: [
        {
          label: 'Edit',
          onClick: (row) => row && handleEditMeet(row),
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

  useEffect(() => {
    if (!isLoadingMeets && !isLoadedMeets) loadMeets();
  }, []);

  return (
    <>
      {!isLoadingMeets ? (
        <div>
          <div className="flex justify-between items-center">
            <div className="">
              <TextInput
                placeholder="Search Sessions"
                leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              />
            </div>
            <div>
              <Button
                leftsection={<PlusIcon weight="bold" className="w-4 h-4" />}
                onClick={() => handleCreateMeet(new Date())}
              >
                Add <span className="hidden sm:inline">Session</span>
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <DataTable rows={meets} columns={columns} />
          </div>
        </div>
      ) : (
        <FullScreenLoader withHeader loading={isLoadingMeets} />
      )}
      <UpsertMeetingModal isOpen={state.isOpenUpsertMeetingModal} onClose={closeUpsertMeetingModal} />
      <MeetingOverviewModal
        openEditModal={openUpsertMeetingModal}
        openDeleteModal={() => {}}
        isOpen={state.isOpenMeetingOverviewModal}
        onClose={closeMeetingOverviewModal}
      />
    </>
  );
};
