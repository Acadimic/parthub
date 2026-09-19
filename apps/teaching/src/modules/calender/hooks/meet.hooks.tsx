import { type MeetDto } from '@repo/shared/contracts';
import { type IFullCalendarEvent } from '@interfaces';
import { useMeetLookups, useSelectorLookups } from '@stores';
import { reportError, successToast } from '@utils/helpers';
import { useSetState } from 'react-use';

interface IState {
  isOpenUpsertMeetingModal: boolean;
  isOpenMeetingOverviewModal: boolean;
  /** The session the delete confirm is asking about, or `null` while it is closed. */
  meetToDelete: MeetDto | null;
  isDeletingMeet: boolean;
}

/** The dialogs a screen that shows sessions needs: create/edit, overview, and delete with a confirm. */
export const useMeetHooks = () => {
  const meetStore = useMeetLookups();
  const selectorStore = useSelectorLookups();
  const { createMeet, deleteMeet, getMeetById } = meetStore;
  const { setSelectedMeetId, setSelectedCalenderEvent, selectedMeetId } = selectorStore;

  const [state, setState] = useSetState<IState>({
    isOpenUpsertMeetingModal: false,
    isOpenMeetingOverviewModal: false,
    meetToDelete: null,
    isDeletingMeet: false,
  });

  const openUpsertMeetingModal = () => setState({ isOpenUpsertMeetingModal: true });
  const openMeetingOverviewModal = () => setState({ isOpenMeetingOverviewModal: true });
  const closeUpsertMeetingModal = () => setState({ isOpenUpsertMeetingModal: false });
  const closeMeetingOverviewModal = () => setState({ isOpenMeetingOverviewModal: false });

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

  /** Asks before deleting. Without a session it asks about the selected one, which is what the overview shows. */
  const openDeleteMeet = (meet?: MeetDto) => {
    const target = meet ?? getMeetById(selectedMeetId);
    if (target) setState({ meetToDelete: target, isOpenMeetingOverviewModal: false });
  };

  const closeDeleteMeet = () => {
    if (!state.isDeletingMeet) setState({ meetToDelete: null });
  };

  const confirmDeleteMeet = async () => {
    const meet = state.meetToDelete;
    if (!meet) return;
    try {
      setState({ isDeletingMeet: true });
      await deleteMeet(meet._id);
      successToast({ message: 'Session deleted.' });
      setState({ meetToDelete: null });
    } catch (error) {
      reportError(error, 'Could not delete the session.');
    } finally {
      setState({ isDeletingMeet: false });
    }
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
    openDeleteMeet,
    closeDeleteMeet,
    confirmDeleteMeet,
  };
};
