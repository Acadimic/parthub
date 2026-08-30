import { Label, Modal } from '@components/app';
import { CopyUrl } from '@components/common';
import { CalendarBlank, Pencil, Trash } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { getFormattedTime, getFrequencyText, getFullFormattedDate } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { JoiningLink } from './JoiningLink';
import { MeetingTitle } from './MeetingTitle';
import { ViewMeetAttendees } from './ViewMeetAttendees';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  openEditModal: () => void;
  openDeleteModal: () => void;
}

export const MeetingOverviewModal = observer(({ isOpen, onClose, openEditModal, openDeleteModal }: IProps) => {
  const { selectorStore, userStore } = useStores();
  const { selectedMeet, selectedCalenderEvent } = selectorStore;

  if (!selectedMeet || !selectedCalenderEvent) return null;

  const handleEditModal = () => {
    openEditModal();
    onClose();
  };

  const handleDeleteModal = () => {
    openDeleteModal();
    onClose();
  };

  return (
    <Modal
      title="Session Overview"
      isOpen={isOpen}
      onClose={onClose}
      component={
        <div className="flex flex-col gap-6 py-2">
          <div className="flex items-start justify-between gap-2">
            <MeetingTitle meet={selectedMeet} className="text-lg" />
            <div className="flex items-center gap-3">
              <div className="cursor-pointer p-1" onClick={handleEditModal}>
                <Pencil className="w-4 h-4" />
              </div>
              <div className="cursor-pointer p-1" onClick={handleDeleteModal}>
                <Trash className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-xs font-medium flex flex-col gap-1.5 px-0.5">
            <div className="flex items-center gap-2 text-sm font-medium text-color-secondary">
              <CalendarBlank weight="bold" className="w-4 h-4" />
              <Label label="Date and Time" />
            </div>
            <div>
              {getFullFormattedDate(selectedCalenderEvent.start)} {getFormattedTime(selectedCalenderEvent.start)} -{' '}
              {getFormattedTime(selectedCalenderEvent.end)}
              <div>{getFrequencyText([...selectedMeet.weekDays], selectedCalenderEvent.start)}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 px-0.5">
            <ViewMeetAttendees attendeeIds={selectedMeet.attendees} isTeachers />
            <ViewMeetAttendees attendeeIds={selectedMeet.attendees} isStudents />
          </div>
          <div className="flex items-end w-full justify-between mt-3">
            <CopyUrl url={selectedMeet.meetingLink} />
            <JoiningLink url={selectedMeet.meetingLink} />
          </div>
        </div>
      }
    />
  );
});
