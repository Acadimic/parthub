import { CopyUrl } from '@components/common';
import { ArrowsClockwiseIcon, CalendarBlankIcon, ClockIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { Button, Modal } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { useSelectedMeet, useSelectorLookups } from '@stores';
import { getMeetFrequencyMeta } from '@utils/constants';
import { getFormattedTime, getFrequencyText, getFullFormattedDate } from '@utils/helpers';
import { JoiningLink } from './JoiningLink';
import { MeetingTitle } from './MeetingTitle';
import { ViewMeetAttendees } from './ViewMeetAttendees';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  openEditModal: () => void;
  openDeleteModal: () => void;
}

/** One labelled fact about the session. */
const Fact = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  </div>
);

/**
 * What a click on a calendar event opens: the session's title, when it runs, who is in it, and
 * the joining link, with Edit and Delete as real buttons in the footer rather than bare icons.
 */
export const MeetingOverviewModal = ({ isOpen, onClose, openEditModal, openDeleteModal }: IProps) => {
  const { selectedCalenderEvent } = useSelectorLookups();
  const selectedMeet = useSelectedMeet();

  if (!selectedMeet || !selectedCalenderEvent) return null;

  const handleEdit = () => {
    openEditModal();
    onClose();
  };

  return (
    <Modal
      title="Session"
      isOpen={isOpen}
      onClose={onClose}
      className="w-[calc(100%-2rem)] md:w-[32rem]"
      component={
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start gap-2">
            <MeetingTitle meet={selectedMeet} className="text-base" />
            <Badge tone="neutral" appearance="soft" className="ml-auto">
              {getMeetFrequencyMeta(selectedMeet.frequency).label}
            </Badge>
          </div>
          <div className="flex flex-col gap-3">
            <Fact icon={<CalendarBlankIcon className="h-4 w-4" />} label="Date">
              {getFullFormattedDate(selectedCalenderEvent.start)}
            </Fact>
            <Fact icon={<ClockIcon className="h-4 w-4" />} label="Time">
              {getFormattedTime(selectedCalenderEvent.start)} – {getFormattedTime(selectedCalenderEvent.end)}
              {selectedMeet.durationMins ? (
                <span className="text-muted-foreground"> · {selectedMeet.durationMins} min</span>
              ) : null}
            </Fact>
            {selectedMeet.weekDays?.length ? (
              <Fact icon={<ArrowsClockwiseIcon className="h-4 w-4" />} label="Repeats">
                {getFrequencyText([...selectedMeet.weekDays], selectedCalenderEvent.start)}
              </Fact>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ViewMeetAttendees attendeeIds={selectedMeet.attendees ?? []} isTeachers />
            <ViewMeetAttendees attendeeIds={selectedMeet.attendees ?? []} isStudents />
          </div>
          {selectedMeet.meetingLink ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{selectedMeet.meetingLink}</span>
              <CopyUrl url={selectedMeet.meetingLink} isCopyIconOnly />
              <JoiningLink url={selectedMeet.meetingLink} isSmall />
            </div>
          ) : null}
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            isSubtle
            isDestructive
            text="Delete"
            leftsection={<TrashIcon weight="bold" className="h-4 w-4" />}
            onClick={openDeleteModal}
          />
          <div className="flex items-center gap-2">
            <Button isSubtle text="Close" onClick={onClose} />
            <Button
              isSecondary
              text="Edit"
              leftsection={<PencilSimpleIcon weight="bold" className="h-4 w-4" />}
              onClick={handleEdit}
            />
          </div>
        </div>
      }
    />
  );
};
