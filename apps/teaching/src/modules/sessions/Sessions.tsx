import { type MeetDto } from '@repo/shared/contracts';
import { DataTable } from '@components/app/tables';
import { CopyUrl } from '@components/common';
import { BlankState } from '@components/others';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { Button, SoftConfirmModal, TextInput } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { type IColumnData, type ISelectItem } from '@interfaces';
import {
  JoiningLink,
  MeetingOverviewModal,
  MeetingTitle,
  UpsertMeetingModal,
  ViewMeetAttendees,
} from '@modules/calender/components';
import { useMeetHooks } from '@modules/calender/hooks';
import { useMeetLookups } from '@stores';
import { MEET_FREQUENCIES, MEET_FREQUENCY_ORDER, getMeetFrequencyMeta } from '@utils/constants';
import { getFormattedTime, getFrequencyText, getFullFormattedDate } from '@utils/helpers';
import { useEffect, useMemo } from 'react';
import { useSetState } from 'react-use';
import { ACTIONS, getNextMeetOccurrence, toRecurringMeet } from '@repo/shared/utils';

interface IState {
  search: string;
}

const FREQUENCY_OPTIONS: ISelectItem[] = MEET_FREQUENCY_ORDER.map((frequency) => ({
  label: MEET_FREQUENCIES[frequency].label,
  value: frequency,
}));

/** When a session next runs, or its own span once it is over. */
const nextOccurrence = (meet: MeetDto): { start: string; end: string } | null => {
  const schedule = toRecurringMeet(meet);
  if (!schedule) return null;
  const next = getNextMeetOccurrence(schedule, new Date()) ?? schedule;
  return { start: next.startTime, end: next.endTime };
};

const NextRun = ({ meet }: { meet: MeetDto }) => {
  const next = nextOccurrence(meet);
  if (!next) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex flex-col">
      <span className="truncate font-medium text-foreground">{getFullFormattedDate(next.start)}</span>
      <span className="truncate text-xs text-muted-foreground">
        {getFormattedTime(next.start)} – {getFormattedTime(next.end)}
      </span>
    </span>
  );
};

export const Sessions = () => {
  const meetStore = useMeetLookups();
  const { loadMeets } = meetStore;
  const meets = meetStore.getMeets();
  const isLoading = meetStore.isLoading('meets') && !meetStore.isLoaded('meets');
  const isFailed = meetStore.isFailed('meets');
  const {
    state: meetState,
    handleCreateMeet,
    openUpsertMeetingModal,
    closeUpsertMeetingModal,
    closeMeetingOverviewModal,
    handleEditMeet,
    openDeleteMeet,
    closeDeleteMeet,
    confirmDeleteMeet,
  } = useMeetHooks();
  const [state, setState] = useSetState<IState>({ search: '' });

  // Saved rows only, matched against the title. The search box used to have no handler.
  const visibleMeets = useMemo(() => {
    const saved = meets.filter((meet) => !meet.isNew);
    const term = state.search.trim().toLowerCase();
    if (!term) return saved;
    return saved.filter((meet) => `${meet.title} ${meet.description ?? ''}`.toLowerCase().includes(term));
  }, [meets, state.search]);

  const columns: IColumnData<MeetDto>[] = [
    {
      label: 'Session',
      dataKey: 'title',
      width: 260,
      isSortable: true,
      component: (row) => <MeetingTitle meet={row} className="font-semibold text-foreground" />,
    },
    {
      label: 'Next run',
      dataKey: 'startTime',
      width: 190,
      sortValue: (row) => {
        const next = nextOccurrence(row);
        return next ? new Date(next.start).getTime() : null;
      },
      component: (row) => <NextRun meet={row} />,
    },
    {
      label: 'Repeats',
      dataKey: 'frequency',
      width: 200,
      filters: [{ key: 'frequency', label: 'Repeats', options: FREQUENCY_OPTIONS, getValues: (row) => row.frequency }],
      component: (row) => (
        <span className="flex flex-col">
          <Badge tone="neutral" appearance="soft" className="w-fit">
            {getMeetFrequencyMeta(row.frequency).label}
          </Badge>
          {row.startTime && row.weekDays?.length ? (
            <span className="mt-0.5 truncate text-xs text-muted-foreground">
              {getFrequencyText([...row.weekDays], row.startTime)}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      label: 'Teachers',
      dataKey: 'teachers',
      width: 150,
      component: (row) => <ViewMeetAttendees attendeeIds={row.attendees ?? []} isTeachers noLabel />,
    },
    {
      label: 'Students',
      dataKey: 'students',
      width: 150,
      component: (row) => <ViewMeetAttendees attendeeIds={row.attendees ?? []} isStudents noLabel />,
    },
    {
      label: 'Duration',
      dataKey: 'durationMins',
      width: 110,
      align: 'right',
      sortValue: (row) => row.durationMins ?? 0,
      valueFormatter: (row) => (row.durationMins ? <span className="font-mono">{row.durationMins} min</span> : ''),
    },
    {
      label: 'Join',
      dataKey: 'join',
      width: 150,
      component: (row) =>
        row.meetingLink ? (
          <span className="flex items-center gap-1">
            <JoiningLink url={row.meetingLink} isSmall />
            <CopyUrl url={row.meetingLink} isCopyIconOnly />
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      width: 90,
      menuItems: [
        {
          label: 'Edit',
          onClick: (row) => row && handleEditMeet(row),
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Delete',
          onClick: (row) => row && openDeleteMeet(row),
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
    },
  ];

  useEffect(() => {
    if (meetStore.shouldLoad('meets')) loadMeets();
  }, []);

  const addButton = (
    <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={() => handleCreateMeet(new Date())}>
      Add <span className="hidden sm:inline">session</span>
    </Button>
  );

  const emptyState = state.search.trim() ? (
    <BlankState
      label="No matching sessions"
      description="Try a different title."
      action={<Button isSecondary text="Clear search" onClick={() => setState({ search: '' })} />}
    />
  ) : (
    <BlankState
      label="No sessions yet"
      description="Schedule a live class and share its joining link with a batch."
      action={addButton}
    />
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-72">
            <TextInput
              placeholder="Search sessions"
              value={state.search}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ search: event.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              aria-label="Search sessions"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {meets.length} {meets.length === 1 ? 'session' : 'sessions'}
            <span className="hidden md:inline"> · Filter by how often a session repeats from the column header.</span>
          </p>
          <div className="ml-auto">{addButton}</div>
        </div>
        {isFailed ? (
          <BlankState
            label="Could not load sessions"
            description={meetStore.getError('meets')}
            action={<Button text="Retry" onClick={() => loadMeets()} />}
            className="rounded-lg border border-border bg-background py-10"
          />
        ) : (
          <DataTable rows={visibleMeets} columns={columns} isLoading={isLoading} emptyState={emptyState} />
        )}
      </div>
      <UpsertMeetingModal isOpen={meetState.isOpenUpsertMeetingModal} onClose={closeUpsertMeetingModal} />
      <MeetingOverviewModal
        openEditModal={openUpsertMeetingModal}
        openDeleteModal={() => openDeleteMeet()}
        isOpen={meetState.isOpenMeetingOverviewModal}
        onClose={closeMeetingOverviewModal}
      />
      <SoftConfirmModal
        title="Delete session"
        description={`Delete "${meetState.meetToDelete?.title ?? 'this session'}"? Its attendees lose the joining link.`}
        isOpen={!!meetState.meetToDelete}
        isLoading={meetState.isDeletingMeet}
        isDestructive
        confirmText="Delete"
        onCancel={closeDeleteMeet}
        onConfirm={confirmDeleteMeet}
      />
    </>
  );
};
