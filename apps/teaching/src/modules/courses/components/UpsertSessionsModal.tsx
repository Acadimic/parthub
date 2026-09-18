import { Select } from '@components/app/selects';
import { Modal, ModalFooter } from '@repo/ui/app';
import { HorizontalLineWithText } from '@components/others';
import { type ISelectItem } from '@interfaces';
import { CourseService } from '@services';
import { useCourseLookups, useCourseStore, useMeetLookups, useSelectedCourse } from '@stores';
import { getFrequencyText, reportError, successToast } from '@utils/helpers';
import { useEffect, useRef, useState } from 'react';
import { SessionsView } from './SessionsView';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpsertSessionsModal = ({ isOpen, onClose }: IProps) => {
  const courseStore = useCourseLookups();
  const { patchCourse, addCourses } = courseStore;
  const meetStore = useMeetLookups();
  const selectedCourse = useSelectedCourse();
  const { calculateAndSetCourseStatsByCourseId } = courseStore;
  const meets = meetStore.getMeets();
  const [isLoading, setIsLoading] = useState(false);
  // The course's sessions as they were when the dialog opened. Picking one patches the store
  // immediately, so cancelling has to have something to put back.
  const selectedMeetsRef = useRef<string[] | undefined>(undefined);

  const closeModal = () => {
    if (isLoading) return;
    const courseId = selectedCourse?._id;
    if (courseId && selectedMeetsRef.current) patchCourse(courseId, { meets: selectedMeetsRef.current });
    selectedMeetsRef.current = undefined;
    onClose();
  };

  const handleMeetsChange = (values: ISelectItem[]) => {
    if (!selectedCourse) return;
    patchCourse(selectedCourse._id, { meets: values.map((value) => value.value) });
  };

  const saveSessions = async () => {
    const courseId = selectedCourse?._id;
    if (!courseId) return;
    try {
      setIsLoading(true);
      calculateAndSetCourseStatsByCourseId(courseId);
      // Read the row back rather than posting `selectedCourse`: the store holds immutable rows, so
      // the copy captured during render carries neither the last pick nor the fresh stats.
      const course = useCourseStore.getState().getCourseById(courseId);
      if (!course) return;
      const result = await CourseService.upsertCourse(course);
      if (result?.data) addCourses([result.data]);
      successToast({ message: 'Sessions added successfully.' });
      // Saved, so there is nothing to revert to.
      selectedMeetsRef.current = undefined;
      onClose();
    } catch (error) {
      reportError(error, 'Could not save the sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    selectedMeetsRef.current = [...(useCourseStore.getState().getCourseById(selectedCourse?._id ?? '')?.meets ?? [])];
  }, [isOpen, selectedCourse?._id]);

  return (
    <>
      <Modal
        title={`Add Sessions`}
        description="Sessions are the live meetings a learner joins as part of this course."
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
                    group: meet.startTime ? getFrequencyText([...(meet.weekDays ?? [])], meet.startTime) : '',
                    description: meet.description,
                  }))}
                  required
                  isDisabled={isLoading}
                  values={selectedCourse.meets ?? []}
                  onChange={handleMeetsChange}
                  isGrouped
                />
                {(selectedCourse.meets ?? []).length ? (
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
            onSave={saveSessions}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        }
      />
    </>
  );
};
