import { Select } from '@components/app/selects';
import { DateInput, Dropdown, Label, Link, Modal, ModalFooter, TextArea, TextInput, TimeInput } from '@repo/ui/app';
import { CircleIcon, LinkSimpleIcon } from '@phosphor-icons/react';
import { ColorType, MeetFrequency, PositionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { MeetService } from '@services';
import { useStandardLookups, useBatchLookups, useMeetLookups, useSelectedMeet, useUserLookups } from '@stores';
import { getEventColor } from '@themes';
import { WEEK_DAYS_INTEGER_MAPPINGS } from '@utils/constants';
import { splitCamelCase, successToast } from '@utils/helpers';
import { useState } from 'react';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export enum MeetStatus {
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
}

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEEKDAYS: ISelectItem[] = Object.keys(WEEK_DAYS_INTEGER_MAPPINGS).map((key) => ({
  label: WEEK_DAYS_INTEGER_MAPPINGS[key],
  value: key,
}));

/**
 * `MeetDto` leaves a meet's span, colour and frequency optional, because one class serves both
 * directions and a write body need not send them. These narrow once, outside the component, so the
 * modal reads the same as before rather than carrying a conditional per field.
 */
const toDate = (value: string | undefined): Date | null => (value ? new Date(value) : null);

const toValues = (value: string | undefined): string[] => (value ? [value] : []);

const isRepeatingFrequency = (frequency: MeetFrequency | undefined): boolean =>
  !!frequency && [MeetFrequency.WEEKLY, MeetFrequency.THIS_WEEK].includes(frequency);

export const UpsertMeetingModal = ({ isOpen, onClose }: IProps) => {
  const meetStore = useMeetLookups();
  const { setMeetDate } = meetStore;
  const { patchMeet } = meetStore;
  const batchStore = useBatchLookups();
  const userStore = useUserLookups();
  const selectedMeet = useSelectedMeet();
  const { getStandardItems } = useStandardLookups();
  const batchItems = batchStore.getBatchItems();
  const studentItems = userStore.getStudentItems();
  const collaboratorItems = userStore.getCollaboratorItems();
  const { removeMeetById } = meetStore;
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (!selectedMeet || isLoading) return;
    if (selectedMeet.isNew) removeMeetById(selectedMeet._id);
    onClose();
  };

  const handleSave = async () => {
    if (!selectedMeet) return;
    try {
      setIsLoading(true);
      await MeetService.upsertMeet(selectedMeet);
      patchMeet(selectedMeet._id, { isNew: false });
      successToast({ message: 'Session successfully scheduled.' });
      handleClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const mode =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  return (
    <Modal
      position={PositionType.RIGHT}
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedMeet?.isNew ? 'Create Session' : 'Update Session'}
      component={
        selectedMeet ? (
          <div className="space-y-4 px-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-full">
                <Label label="Color" required />
                <div className="">
                  <Dropdown
                    menuItems={Object.values(ColorType).map((item) => ({
                      label: capitalize(item),
                      icon: (
                        <CircleIcon weight="fill" style={{ color: getEventColor(mode, item) }} className={` w-5 h-5`} />
                      ),
                      onClick: () => patchMeet(selectedMeet._id, { color: item }),
                    }))}
                    selected={selectedMeet.color ?? ''}
                    component={
                      <div className="h-full px-0">
                        <CircleIcon
                          weight="fill"
                          style={{
                            color: getEventColor(mode, selectedMeet.color),
                          }}
                          className={`w-5 h-5`}
                        />
                      </div>
                    }
                  />
                </div>
              </div>
              <div className="flex-1">
                <TextInput
                  label="Title"
                  required
                  value={selectedMeet.title}
                  onChange={(e) => patchMeet(selectedMeet._id, { title: e.target.value })}
                  placeholder="Enter meeting title"
                />
              </div>
            </div>

            <TextArea
              label="Description"
              value={selectedMeet.description}
              onChange={(e) => patchMeet(selectedMeet._id, { description: e.target.value })}
              placeholder="Enter meeting description"
            />

            <Select
              label="Attendees"
              required
              values={selectedMeet.attendees ?? []}
              items={[...studentItems, ...collaboratorItems]}
              onChange={(items) => patchMeet(selectedMeet._id, { attendees: items.map((item) => item.value) })}
              isGrouped
            />

            <div className="grid grid-cols-3 gap-3">
              <DateInput
                label="Date"
                required
                value={toDate(selectedMeet.startTime)}
                handleChange={(date) => setMeetDate(selectedMeet._id, date)}
              />

              <TimeInput
                label="Start Time"
                required
                value={toDate(selectedMeet.startTime)}
                handleChange={(date) => patchMeet(selectedMeet._id, { startTime: date.toISOString() })}
              />

              <TimeInput
                label="End Time"
                required
                value={toDate(selectedMeet.endTime)}
                handleChange={(date) => patchMeet(selectedMeet._id, { endTime: date.toISOString() })}
              />
            </div>
            {/* <div className="flex">
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => patchMeet(selectedMeet._id, { isRepeat: !selectedMeet.isRepeat })}
            >
              <Checkbox selectedClassName="text-primary" checked={selectedMeet.isRepeat} />
              <span className="text-sm font-medium">Repeat</span>
            </div>
          </div> */}
            <div className="flex items-end space-x-3">
              <Select
                label="Frequency"
                required
                values={toValues(selectedMeet.frequency)}
                items={Object.values(MeetFrequency).map((item) => ({ value: item, label: splitCamelCase(item) }))}
                onChange={(items) =>
                  items[0] && patchMeet(selectedMeet._id, { frequency: items[0].value as MeetFrequency })
                }
                noSort
                isSingleSelect
              />
              {isRepeatingFrequency(selectedMeet.frequency) && (
                <Select
                  label="Repeat on Days"
                  required
                  values={(selectedMeet.weekDays ?? []).map(String)}
                  items={WEEKDAYS}
                  onChange={(items) =>
                    patchMeet(selectedMeet._id, { weekDays: items.map((item) => Number(item.value)) })
                  }
                  noSort
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <TextInput
                label="Meeting Link"
                required
                value={selectedMeet.meetingLink}
                onChange={(e) => patchMeet(selectedMeet._id, { meetingLink: e.target.value })}
                placeholder="Enter meeting link"
              />
              <Link
                className="text-xs"
                href="https://meet.google.com/getalink"
                target="_blank"
                leftsection={<LinkSimpleIcon />}
                isSubtle
              >
                Generate meeting link powered by Google Meet
              </Link>
            </div>

            <Select
              label="Standards"
              required
              values={selectedMeet.standards ?? []}
              items={getStandardItems()}
              onChange={(items) => patchMeet(selectedMeet._id, { standards: items.map((item) => item.value) })}
              isGrouped
            />

            <Select
              label="Batches"
              required
              values={selectedMeet.batches ?? []}
              items={batchItems}
              onChange={(items) => patchMeet(selectedMeet._id, { batches: items.map((item) => item.value) })}
            />
          </div>
        ) : null
      }
      footer={
        <ModalFooter
          saveText={selectedMeet?.isNew ? 'Create' : 'Update'}
          onSave={handleSave}
          onCancel={handleClose}
          isLoading={isLoading}
        />
      }
    />
  );
};
