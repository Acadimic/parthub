import { Button, DataTable, FullScreenLoader, TextInput, Tooltip } from '@components/app';
import { CopyUrl } from '@components/common';
import { MagnifyingGlass, Pencil, Plus, Trash } from '@phosphor-icons/react';
import { IColumnData } from '@interfaces';
import {
  JoiningLink,
  MeetingOverviewModal,
  MeetingTitle,
  UpsertMeetingModal,
  ViewMeetAttendees,
} from '@modules/calender/components';
import { useMeetHooks } from '@modules/calender/hooks';
import { IMeet, useStores } from '@stores';
import { ACTIONS } from '@utils/constants';
import {
  addDaysToDate,
  getFormattedTime,
  getFrequencyText,
  getFullCalendarEvents,
  getFullFormattedDate,
  splitCamelCase,
} from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const Sessions = observer(() => {
  const { push } = useRouter();
  const { selectorStore, userStore, meetStore } = useStores();
  const { meets, isLoadingMeets, loadMeets, isLoadedMeets } = meetStore;
  const {
    state,
    handleCreateMeet,
    openUpsertMeetingModal,
    closeUpsertMeetingModal,
    closeMeetingOverviewModal,
    handleEditMeet,
  } = useMeetHooks();

  const onClickSession = (session: IMeet) => {
    push(`/calender`);
  };

  const columns: IColumnData[] = [
    // {
    //   label: 'Id',
    //   dataKey: '_id',
    // },
    {
      label: 'Name',
      dataKey: 'name',
      valueFormatter: (row: IMeet) => {
        return (
          <div className="cursor-pointer text-blue-primary" onClick={() => onClickSession(row)}>
            <MeetingTitle meet={row} />
          </div>
        );
      },
    },

    {
      label: 'Date and Time',
      dataKey: 'date',
      component: (row: IMeet) => {
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
                <div className="truncate w-full">{getFullFormattedDate(row.startTime)}</div>
                <div className="truncate w-full">{`${getFormattedTime(row.startTime)} - ${getFormattedTime(row.endTime)}`}</div>
              </>
            )}
          </Tooltip>
        );
      },
    },

    {
      label: 'Repeat On',
      dataKey: 'frequencyText',
      component: (row: IMeet) => {
        const frequency = getFrequencyText([...row.weekDays], row.startTime);
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
      component: (row: IMeet) => {
        return <ViewMeetAttendees attendeeIds={row.attendees} isTeachers noLabel />;
      },
    },

    {
      label: 'Students',
      dataKey: 'students',
      component: (row: IMeet) => {
        return <ViewMeetAttendees attendeeIds={row.attendees} isStudents noLabel />;
      },
    },

    {
      label: 'Join',
      dataKey: 'join',
      component: (row: IMeet) => {
        return (
          <div className="flex flex-col gap-2 w-full">
            <JoiningLink url={row.meetingLink} />
            <CopyUrl url={row.meetingLink} />
          </div>
        );
      },
    },

    {
      label: 'Frequency',
      dataKey: 'frequency',
      component: (row: IMeet) => {
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
          onClick: handleEditMeet,
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
                leftsection={<MagnifyingGlass weight="bold" className="w-4 h-4" />}
              />
            </div>
            <div>
              <Button
                leftsection={<Plus weight="bold" className="w-4 h-4" />}
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
});
