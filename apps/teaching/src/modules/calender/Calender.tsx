import { FullScreenLoader } from '@repo/ui/app';
import { useMeetLookups } from '@stores';
import { useEffect } from 'react';
import { FullCalendarView, MeetingOverviewModal, UpsertMeetingModal } from './components';
import { useMeetHooks } from './hooks';

export const Calender = () => {
  const meetStore = useMeetLookups();
  const { loadMeets } = meetStore;
  const isLoadingMeets = meetStore.isLoading('meets');
  const isLoadedMeets = meetStore.isLoaded('meets');
  const {
    state,
    handleEventClick,
    handleCreateMeet,
    openUpsertMeetingModal,
    closeUpsertMeetingModal,
    closeMeetingOverviewModal,
  } = useMeetHooks();

  useEffect(() => {
    loadMeets();
  }, []);

  return (
    <>
      {isLoadingMeets && !isLoadedMeets ? (
        <FullScreenLoader withHeader loading={isLoadingMeets} />
      ) : (
        <>
          <FullCalendarView onEventClick={handleEventClick} onDateClick={handleCreateMeet} />
          <UpsertMeetingModal isOpen={state.isOpenUpsertMeetingModal} onClose={closeUpsertMeetingModal} />
          <MeetingOverviewModal
            openEditModal={openUpsertMeetingModal}
            openDeleteModal={() => {}}
            isOpen={state.isOpenMeetingOverviewModal}
            onClose={closeMeetingOverviewModal}
          />
        </>
      )}
    </>
  );
};
