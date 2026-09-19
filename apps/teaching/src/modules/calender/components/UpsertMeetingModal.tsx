import { type MeetDto } from '@repo/shared/contracts';
import { Select } from '@components/app/selects';
import { CaretDownIcon, LinkSimpleIcon } from '@phosphor-icons/react';
import {
  Collapse,
  DateInput,
  DrawerSection,
  Link,
  Modal,
  ModalFooter,
  TextArea,
  TextInput,
  TimeInput,
} from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { type MeetFrequency, PositionType } from '@enums';
import { MeetService } from '@services';
import { useBatchLookups, useMeetLookups, useSelectedMeet, useStandardLookups, useUserLookups } from '@stores';
import { getMeetFrequencyMeta } from '@utils/constants';
import { errorToast, getFormattedDate, getFrequencyText, reportError, successToast } from '@utils/helpers';
import { useEffect, useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { FrequencyPicker } from './FrequencyPicker';
import { WeekDayPicker } from './WeekDayPicker';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

const toDate = (value: string | undefined): Date | null => (value ? new Date(value) : null);

const minutesBetween = (start: string | undefined, end: string | undefined): number | null => {
  if (!start || !end) return null;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
};

/** The first thing wrong with the session, or `null` when it can be saved. */
const findProblem = (meet: MeetDto): string | null => {
  if (!meet.title.trim()) return 'Give the session a title.';
  const duration = minutesBetween(meet.startTime, meet.endTime);
  if (duration === null) return 'Set a date and time.';
  if (duration <= 0) return 'The end time has to be after the start time.';
  if (getMeetFrequencyMeta(meet.frequency).picksWeekDays && !(meet.weekDays ?? []).length) {
    return 'Pick at least one weekday to repeat on.';
  }
  if (meet.meetingLink && !/^https?:\/\//i.test(meet.meetingLink.trim())) {
    return 'The meeting link should start with http:// or https://.';
  }
  return null;
};

/** A sentence saying when the session runs, so the schedule reads back before it is saved. */
const describeSchedule = (meet: MeetDto): string => {
  if (!meet.startTime) return '';
  const meta = getMeetFrequencyMeta(meet.frequency);
  const from = getFormattedDate(meet.startTime, 'D MMM YYYY');
  if (meta.kind === 'once') return `Once, on ${from}.`;
  const days = getFrequencyText([...(meet.weekDays ?? [])], meet.startTime);
  if (meta.kind === 'thisWeek') return `${days}, this week only, starting ${from}.`;
  return `${days === 'Daily' ? 'Every day' : `Every ${days}`}, from ${from}.`;
};

/** Whether a saved session already carries any of the optional details, which is when they should show at once. */
const hasMoreDetails = (meet: MeetDto) =>
  Boolean(meet.description?.trim() || meet.standards?.length || meet.batches?.length);

/** Date, times, the duration they make, how the session repeats and on which days. */
const ScheduleSection = ({
  meet,
  isLoading,
  onChangeDate,
  onChangeFrequency,
}: {
  meet: MeetDto;
  isLoading: boolean;
  onChangeDate: (date: Date) => void;
  onChangeFrequency: (frequency: MeetFrequency) => void;
}) => {
  const { patchMeet } = useMeetLookups();
  const meta = getMeetFrequencyMeta(meet.frequency);
  const duration = minutesBetween(meet.startTime, meet.endTime);
  return (
    <DrawerSection title="Schedule" isRequired hint={describeSchedule(meet)}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DateInput label="Date" required value={toDate(meet.startTime)} handleChange={onChangeDate} />
          <TimeInput
            label="Starts"
            required
            value={toDate(meet.startTime)}
            handleChange={(date) => patchMeet(meet._id, { startTime: date.toISOString() })}
          />
          <TimeInput
            label="Ends"
            required
            value={toDate(meet.endTime)}
            handleChange={(date) => patchMeet(meet._id, { endTime: date.toISOString() })}
          />
        </div>
        <p className={cn('text-xs', duration !== null && duration <= 0 ? 'text-destructive' : 'text-muted-foreground')}>
          {duration === null ? 'Set a start and an end time.' : null}
          {duration !== null && duration > 0 ? `${duration} minutes` : null}
          {duration !== null && duration <= 0 ? 'The end time has to be after the start time.' : null}
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-foreground">Repeats</p>
          <FrequencyPicker value={meet.frequency} onChange={onChangeFrequency} isDisabled={isLoading} />
        </div>
        {meta.picksWeekDays ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">On these days</p>
            <WeekDayPicker
              value={meet.weekDays ?? []}
              onChange={(weekDays) => patchMeet(meet._id, { weekDays })}
              isDisabled={isLoading}
            />
          </div>
        ) : null}
      </div>
    </DrawerSection>
  );
};

/**
 * The session drawer, in the order a teacher thinks about a class: what it is, when it runs, who
 * is in it, how to join. The optional details — a description, standards, batches — sit behind a
 * disclosure so a quick session is four fields, and the fixed frequency dropdown became a picker
 * built from the frequency table with weekday chips where they apply.
 */
export const UpsertMeetingModal = ({ isOpen, onClose }: IProps) => {
  const meetStore = useMeetLookups();
  const { setMeetDate, patchMeet, removeMeetById } = meetStore;
  const batchStore = useBatchLookups();
  const userStore = useUserLookups();
  const selectedMeet = useSelectedMeet();
  const { getStandardItems } = useStandardLookups();
  const [isLoading, setIsLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Opens the details when a saved session already has some; a fresh one starts with them folded.
  useEffect(() => {
    if (isOpen && selectedMeet) setShowMore(hasMoreDetails(selectedMeet));
  }, [isOpen, selectedMeet?._id]);

  const handleClose = () => {
    if (!selectedMeet || isLoading) return;
    if (selectedMeet.isNew) removeMeetById(selectedMeet._id);
    onClose();
  };

  const handleSave = async () => {
    if (!selectedMeet) return;
    const problem = findProblem(selectedMeet);
    if (problem) {
      errorToast({ message: problem });
      return;
    }
    try {
      setIsLoading(true);
      await MeetService.upsertMeet(selectedMeet);
      patchMeet(selectedMeet._id, { isNew: false });
      successToast({ message: selectedMeet.isNew ? 'Session scheduled.' : 'Session updated.' });
      // `onClose`, not `handleClose`: that one drops a draft, and the render closure still calls
      // this session a draft — it used to remove the row that had just been saved.
      onClose();
    } catch (error) {
      reportError(error, 'Could not save the session.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedMeet) return null;

  const changeFrequency = (frequency: MeetFrequency) => {
    const start = toDate(selectedMeet.startTime) ?? new Date();
    patchMeet(selectedMeet._id, { frequency, weekDays: getMeetFrequencyMeta(frequency).defaultWeekDays(start) });
  };

  const changeDate = (date: Date) => {
    setMeetDate(selectedMeet._id, date);
    // A weekly pattern with no day chosen yet follows the date, so the first pick is never empty.
    if (getMeetFrequencyMeta(selectedMeet.frequency).picksWeekDays && !(selectedMeet.weekDays ?? []).length) {
      patchMeet(selectedMeet._id, { weekDays: [date.getDay()] });
    }
  };

  return (
    <Modal
      position={PositionType.RIGHT}
      className="w-full md:w-[36rem] md:max-w-[90%]"
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedMeet.isNew ? 'New session' : 'Edit session'}
      description="A live class with a joining link. Only the title and time are needed to schedule it."
      component={
        <div className="flex flex-col gap-6">
          <DrawerSection title="Session" isRequired>
            <div className="flex flex-col gap-3">
              <TextInput
                value={selectedMeet.title}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  patchMeet(selectedMeet._id, { title: event.target.value })
                }
                placeholder="Physics doubt clearing"
                disabled={isLoading}
                aria-label="Title"
                autoFocus={selectedMeet.isNew}
              />
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">Colour on the calendar</span>
                <ColorPicker
                  value={selectedMeet.color}
                  onChange={(color) => patchMeet(selectedMeet._id, { color })}
                  isDisabled={isLoading}
                />
              </div>
            </div>
          </DrawerSection>

          <ScheduleSection
            meet={selectedMeet}
            isLoading={isLoading}
            onChangeDate={changeDate}
            onChangeFrequency={changeFrequency}
          />

          <DrawerSection title="People" hint="Students and collaborators who should see the session and its link.">
            <Select
              placeholder="Add attendees"
              values={selectedMeet.attendees ?? []}
              items={[...userStore.getStudentItems(), ...userStore.getCollaboratorItems()]}
              onChange={(items) => patchMeet(selectedMeet._id, { attendees: items.map((item) => item.value) })}
              isGrouped
              isDisabled={isLoading}
            />
          </DrawerSection>

          <DrawerSection title="Joining link" hint="Where attendees go when the session starts.">
            <div className="flex flex-col gap-1.5">
              <TextInput
                value={selectedMeet.meetingLink}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  patchMeet(selectedMeet._id, { meetingLink: event.target.value })
                }
                placeholder="https://meet.google.com/…"
                disabled={isLoading}
                aria-label="Meeting link"
                leftsection={<LinkSimpleIcon className="h-4 w-4" />}
              />
              <Link
                className="h-auto w-fit px-0 py-0 text-xs font-medium text-primary hover:underline"
                href="https://meet.google.com/getalink"
                target="_blank"
                isSubtle
              >
                Get a Google Meet link
              </Link>
            </div>
          </DrawerSection>

          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
            <button
              type="button"
              onClick={() => setShowMore((current) => !current)}
              aria-expanded={showMore}
              className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>
                <span className="block text-sm font-semibold text-foreground">More details</span>
                <span className="block text-xs text-muted-foreground">
                  Optional: a description, and the standards or batches this session is for.
                </span>
              </span>
              <CaretDownIcon
                weight="bold"
                className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', showMore && 'rotate-180')}
              />
            </button>
            <Collapse isOpen={showMore}>
              <div className="flex flex-col gap-4 pt-1">
                <TextArea
                  label="Description"
                  value={selectedMeet.description ?? ''}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                    patchMeet(selectedMeet._id, { description: event.target.value })
                  }
                  placeholder="What the session covers, and anything to prepare."
                  disabled={isLoading}
                />
                <Select
                  label="Standards"
                  placeholder="Any standard"
                  values={selectedMeet.standards ?? []}
                  items={getStandardItems()}
                  onChange={(items) => patchMeet(selectedMeet._id, { standards: items.map((item) => item.value) })}
                  isGrouped
                  isDisabled={isLoading}
                />
                <Select
                  label="Batches"
                  placeholder="Any batch"
                  values={selectedMeet.batches ?? []}
                  items={batchStore.getBatchItems()}
                  onChange={(items) => patchMeet(selectedMeet._id, { batches: items.map((item) => item.value) })}
                  isDisabled={isLoading}
                />
              </div>
            </Collapse>
          </div>
        </div>
      }
      footer={
        <ModalFooter
          saveText={selectedMeet.isNew ? 'Schedule session' : 'Save changes'}
          onSave={handleSave}
          onCancel={handleClose}
          isLoading={isLoading}
        />
      }
    />
  );
};
