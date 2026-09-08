import { Select } from '@components/app/selects';
import { DateInput, Dropdown, Label, Link, Modal, ModalFooter, TextArea, TextInput, TimeInput } from '@repo/ui/app';
import { CircleIcon, LinkSimpleIcon } from '@phosphor-icons/react';
import { ColorType, MeetFrequency, PositionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { MeetService } from '@services';
import { useStores } from '@stores';
import { dark, light } from '@themes';
import { WEEK_DAYS_INTEGER_MAPPINGS } from '@utils/constants';
import { splitCamelCase, successToast } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
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

export const UpsertMeetingModal = observer(({ isOpen, onClose }: IProps) => {
  const { selectorStore, meetStore, standardStore, batchStore, userStore } = useStores();
  const { selectedMeet } = selectorStore;
  const { standardItems } = standardStore;
  const { batchItems } = batchStore;
  const { studentItems, collaboratorItems } = userStore;
  const { removeMeetById } = meetStore;
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (!selectedMeet || isLoading) return;
    if (selectedMeet.isNew) removeMeetById(selectedMeet._id);
    console.log('handleClose');
    onClose();
  };

  const handleSave = async () => {
    if (!selectedMeet) return;
    try {
      setIsLoading(true);
      await MeetService.upsertMeet(selectedMeet);
      selectedMeet.resetIsNew();
      successToast({ message: 'Session successfully scheduled.' });
      handleClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const colorObject = isDark ? dark : light;

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
                        <CircleIcon
                          weight="fill"
                          style={{ color: colorObject.colors[item]?.primary }}
                          className={` w-5 h-5`}
                        />
                      ),
                      onClick: () => selectedMeet.setColor(item),
                    }))}
                    selected={selectedMeet.color}
                    component={
                      <div className="h-full px-0">
                        <CircleIcon
                          weight="fill"
                          style={{ color: colorObject.colors[selectedMeet.color]?.primary }}
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
                  onChange={(e) => selectedMeet.setTitle(e.target.value)}
                  placeholder="Enter meeting title"
                />
              </div>
            </div>

            <TextArea
              label="Description"
              value={selectedMeet.description}
              onChange={(e) => selectedMeet.setDescription(e.target.value)}
              placeholder="Enter meeting description"
            />

            <Select
              label="Attendees"
              required
              values={selectedMeet.attendees}
              items={[...studentItems, ...collaboratorItems]}
              onChange={(items) => selectedMeet.setAttendees(items.map((item) => item.value))}
              isGrouped
            />

            <div className="grid grid-cols-3 gap-3">
              <DateInput
                label="Date"
                required
                value={new Date(selectedMeet.startTime)}
                handleChange={(date) => selectedMeet.setDate(date)}
              />

              <TimeInput
                label="Start Time"
                required
                value={new Date(selectedMeet.startTime)}
                handleChange={(date) => selectedMeet.setStartTime(date)}
              />

              <TimeInput
                label="End Time"
                required
                value={new Date(selectedMeet.endTime)}
                handleChange={(date) => selectedMeet.setEndTime(date)}
              />
            </div>
            {/* <div className="flex">
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => selectedMeet.setIsRepeat(!selectedMeet.isRepeat)}
            >
              <Checkbox selectedClassName="text-blue-primary" checked={selectedMeet.isRepeat} />
              <span className="text-sm font-medium">Repeat</span>
            </div>
          </div> */}
            <div className="flex items-end space-x-3">
              <Select
                label="Frequency"
                required
                values={[selectedMeet.frequency]}
                items={Object.values(MeetFrequency).map((item) => ({ value: item, label: splitCamelCase(item) }))}
                onChange={(items) => items[0] && selectedMeet.setFrequency(items[0].value as MeetFrequency)}
                noSort
                isSingleSelect
              />
              {[MeetFrequency.WEEKLY, MeetFrequency.THIS_WEEK].includes(selectedMeet.frequency) && (
                <Select
                  label="Repeat on Days"
                  required
                  values={selectedMeet.weekDays.map(String)}
                  items={WEEKDAYS}
                  onChange={(items) => selectedMeet.setWeekDays(items.map((item) => Number(item.value)))}
                  noSort
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <TextInput
                label="Meeting Link"
                required
                value={selectedMeet.meetingLink}
                onChange={(e) => selectedMeet.setMeetingLink(e.target.value)}
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
              values={selectedMeet.standards}
              items={standardItems}
              onChange={(items) => selectedMeet.setStandards(items.map((item) => item.value))}
              isGrouped
            />

            <Select
              label="Batches"
              required
              values={selectedMeet.batches}
              items={batchItems}
              onChange={(items) => selectedMeet.setBatches(items.map((item) => item.value))}
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
});
