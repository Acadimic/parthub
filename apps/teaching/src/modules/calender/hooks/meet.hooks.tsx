import { type MeetDto } from '@repo/shared/contracts';
import { type IFullCalendarEvent } from '@interfaces';
import { useMeetLookups, useSelectorLookups } from '@stores';
import { useSetState } from 'react-use';

interface IState {
  isOpenUpsertMeetingModal: boolean;
  isOpenMeetingOverviewModal: boolean;
}

export const useMeetHooks = () => {
  const meetStore = useMeetLookups();
  const selectorStore = useSelectorLookups();
  const { createMeet } = meetStore;
  const { setSelectedMeetId, setSelectedCalenderEvent } = selectorStore;

  const [state, setState] = useSetState<IState>({
    isOpenUpsertMeetingModal: false,
    isOpenMeetingOverviewModal: false,
  });

  const openUpsertMeetingModal = () => {
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
    // Select the draft the store just made: without this the dialog opens on nothing and the blank
    // session is left behind on the calendar.
    setSelectedMeetId(createMeet(date)._id);
    openUpsertMeetingModal();
  };

  const handleEventClick = (event: IFullCalendarEvent) => {
    const eventId = event.id.split('_')[0];
    if (!eventId) return;
    setSelectedMeetId(eventId);
    setSelectedCalenderEvent(event);
    openMeetingOverviewModal();
  };

  const handleEditMeet = (meet: MeetDto) => {
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
