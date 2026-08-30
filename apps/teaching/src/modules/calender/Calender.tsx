import { FullScreenLoader } from '@components/app';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { FullCalendarView, MeetingOverviewModal, UpsertMeetingModal } from './components';
import { useMeetHooks } from './hooks';

export const Calender = observer(() => {
  const { meetStore } = useStores();
  const { loadMeets, isLoadingMeets, isLoadedMeets } = meetStore;
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
});
