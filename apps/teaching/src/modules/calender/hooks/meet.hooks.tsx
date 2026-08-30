import { IFullCalendarEvent } from '@interfaces';
import { IMeet, useStores } from '@stores';
import { useSetState } from 'react-use';

interface IState {
  isOpenUpsertMeetingModal: boolean;
  isOpenMeetingOverviewModal: boolean;
}

export const useMeetHooks = () => {
  const { meetStore, selectorStore } = useStores();
  const { createMeet } = meetStore;
  const { setSelectedMeetId, setSelectedCalenderEvent } = selectorStore;

  const [state, setState] = useSetState<IState>({
    isOpenUpsertMeetingModal: false,
    isOpenMeetingOverviewModal: false,
  });

  const openUpsertMeetingModal = () => {
    console.log('openUpsertMeetingModal');
    setState({ isOpenUpsertMeetingModal: true });
  };

  const openMeetingOverviewModal = () => {
    setState({ isOpenMeetingOverviewModal: true });
  };

  const closeUpsertMeetingModal = () => {
    setState({ isOpenUpsertMeetingModal: false });
  };

  const closeMeetingOverviewModal = () => {
    setState({ isOpenMeetingOverviewModal: false });
  };

  const handleCreateMeet = (date: Date) => {
    createMeet(date);
    openUpsertMeetingModal();
  };

  const handleEventClick = (event: IFullCalendarEvent) => {
    const eventId = event.id.split('_')[0];
    if (!eventId) return;
    setSelectedMeetId(eventId);
    setSelectedCalenderEvent(event);
    openMeetingOverviewModal();
  };

  const handleEditMeet = (meet: IMeet) => {
    setSelectedMeetId(meet._id);
    openUpsertMeetingModal();
  };

  return {
    state,
    openUpsertMeetingModal,
    openMeetingOverviewModal,
    closeUpsertMeetingModal,
    closeMeetingOverviewModal,
    handleCreateMeet,
    handleEventClick,
    handleEditMeet,
  };
};
