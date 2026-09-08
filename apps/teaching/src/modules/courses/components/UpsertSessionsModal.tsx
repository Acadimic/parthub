import { Select } from '@components/app/selects';
import { Modal, ModalFooter } from '@repo/ui/app';
import { HorizontalLineWithText } from '@components/others';
import { type ISelectItem } from '@interfaces';
import { CourseService } from '@services';
import { useCourseLookups, useMeetLookups, useSelectedCourse, useSelectorLookups } from '@stores';
import { getFrequencyText, successToast } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { SessionsView } from './SessionsView';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertSessionsModal = observer(({ isOpen, onClose }: IProps) => {
  const selectorStore = useSelectorLookups();
  const courseStore = useCourseLookups();
  const meetStore = useMeetLookups();
  const selectedCourse = useSelectedCourse();
  const { calculateAndSetCourseStatsByCourseId } = courseStore;
  const meets = meetStore.getMeets();
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = () => {
    onClose();
  };

  const handleMeetsChange = (values: ISelectItem[]) => {
    if (!selectedCourse) return;
    selectedCourse.setMeets(values.map((value) => value.value));
  };

  const saveCourseModule = async () => {
    if (!selectedCourse) return;
    try {
      setIsLoading(true);
      calculateAndSetCourseStatsByCourseId(selectedCourse._id);
      await CourseService.upsertCourse(selectedCourse);
      successToast({ message: 'Sessions added successfully.' });
      onClose();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        // position={PositionType.RIGHT}
        title={`Add Sessions`}
        isOpen={isOpen}
        isLoading={isLoading}
        onClose={closeModal}
        component={
          selectedCourse && (
            <div className="min-h-[60vh] pb-4">
              <div className="flex flex-col space-y-3">
                <Select
                  label="Sessions"
                  items={meets.map((meet) => ({
                    label: meet.title,
                    value: meet._id,
                    group: getFrequencyText([...meet.weekDays], meet.startTime),
                    description: meet.description,
                  }))}
                  required
                  values={selectedCourse.meets}
                  onChange={handleMeetsChange}
                  isGrouped
                />
                {selectedCourse.meets.length ? (
                  <div className="flex flex-col gap-3 pt-4">
                    <HorizontalLineWithText text="Sessions Preview" />
                    <div>
                      <SessionsView course={selectedCourse} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )
        }
        footer={
          <ModalFooter
            saveText="Save"
            cancelText="Cancel"
            onSave={saveCourseModule}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        }
      />
    </>
  );
});
