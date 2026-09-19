import { BlankState } from '@components/others';
import { Button, RectangleSkeleton, SoftConfirmModal } from '@repo/ui/app';
import { useMeetLookups } from '@stores';
import { useEffect } from 'react';
import { FullCalendarView, MeetingOverviewModal, UpsertMeetingModal } from './components';
import { useMeetHooks } from './hooks';

/** The calendar's shape while sessions load: the toolbar row and a grid of cells. */
const CalendarSkeleton = () => (
  <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading calendar">
    <div className="flex items-center gap-2">
      <RectangleSkeleton height={34} width={72} />
      <RectangleSkeleton height={34} width={72} />
      <RectangleSkeleton height={20} width="30%" />
    </div>
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
      {Array.from({ length: 35 }, (_, index) => (
        <div key={index} className="h-20 bg-background" />
      ))}
    </div>
  </div>
);

export const Calender = () => {
  const meetStore = useMeetLookups();
  const { loadMeets } = meetStore;
  const isLoading = meetStore.isLoading('meets') && !meetStore.isLoaded('meets');
  const isFailed = meetStore.isFailed('meets');
  const {
    state,
    handleEventClick,
    handleCreateMeet,
    openUpsertMeetingModal,
    closeUpsertMeetingModal,
    closeMeetingOverviewModal,
    openDeleteMeet,
    closeDeleteMeet,
    confirmDeleteMeet,
  } = useMeetHooks();

  useEffect(() => {
    if (meetStore.shouldLoad('meets')) loadMeets();
  }, []);

  if (isLoading) return <CalendarSkeleton />;

  if (isFailed) {
    return (
      <BlankState
        label="Could not load the calendar"
        description={meetStore.getError('meets')}
        action={<Button text="Retry" onClick={() => loadMeets()} />}
        className="rounded-lg border border-border bg-background py-16"
      />
    );
  }

  return (
    <>
      <FullCalendarView onEventClick={handleEventClick} onDateClick={handleCreateMeet} />
      <UpsertMeetingModal isOpen={state.isOpenUpsertMeetingModal} onClose={closeUpsertMeetingModal} />
      <MeetingOverviewModal
        openEditModal={openUpsertMeetingModal}
        openDeleteModal={() => openDeleteMeet()}
        isOpen={state.isOpenMeetingOverviewModal}
        onClose={closeMeetingOverviewModal}
      />
      <SoftConfirmModal
        title="Delete session"
        description={`Delete "${state.meetToDelete?.title ?? 'this session'}"? Its attendees lose the joining link.`}
        isOpen={!!state.meetToDelete}
        isLoading={state.isDeletingMeet}
        isDestructive
        confirmText="Delete"
        onCancel={closeDeleteMeet}
        onConfirm={confirmDeleteMeet}
      />
    </>
  );
};
