import { type CourseDto, type PlanDto } from '@repo/shared/contracts';
import { UploadFiles } from '@components/app/attachments';
import { Select } from '@components/app/selects';
import { Label, Modal, ModalFooter, TextArea, TextInput } from '@repo/ui/app';
import { PositionType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { type ISelectItem } from '@interfaces';
import { CourseService } from '@services';
import {
  useStandardLookups,
  useCourseLookups,
  useSelectedCourse,
  useSelectedCoursePlans,
  useSelectorLookups,
} from '@stores';
import { ALL } from '@utils/constants';
import { errorToast, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The first thing wrong with the course or its plans, as a message for the user, or undefined when
 * it is ready to save. Pure, so the save handler holds the sequence and not the rules.
 */
const getValidationError = (course: CourseDto, plans: PlanDto[], hasNewFiles: boolean): string | undefined => {
  if (course.name.trim() === '') return 'Please enter a valid course name.';
  if ((course.standards ?? []).length === 0) return 'Please select at least one standard.';
  if ((course.attachments ?? []).length === 0 && !hasNewFiles) return 'Please add at least one course image.';
  for (const plan of plans) {
    if (plan.amount === 0 || plan.realAmount === 0) return 'Please enter valid amount for each plan.';
    if (plan.amount > (plan.realAmount ?? 0)) return 'Real amount should be greater than or equal to amount.';
    if (plan.name.trim() === '') return 'Please enter a valid plan name.';
  }
  if (plans.length === 0) return 'Please add at least one plan.';
  return undefined;
};

export const UpsertCourseModal = ({ isOpen, onClose }: IProps) => {
  const { push } = useRouter();
  const selectorStore = useSelectorLookups();
  const courseStore = useCourseLookups();
  const { patchPlan, getCourseSubjectItems } = courseStore;
  const { patchCourse } = courseStore;
  const { selectedCourseId, removeSelectedCourseId } = selectorStore;
  const selectedCoursePlans = useSelectedCoursePlans();
  const selectedCourse = useSelectedCourse();
  const { getStandardItems } = useStandardLookups();
  const { removeCourseById, loadCoursePlans, calculateAndSetCourseStatsByCourseId } = courseStore;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { uploadFilesToS3 } = useAttachment();

  const closeModal = async () => {
    if (!selectedCourse) return;
    if (selectedCourse.isNew) removeCourseById(selectedCourse._id);
    removeSelectedCourseId();
    setSelectedFiles([]);
    onClose();
  };

  const handleStandardsChange = (values: ISelectItem[]) => {
    if (!selectedCourse) return;
    patchCourse(selectedCourse._id, { standards: values.map((value) => value.value) });
  };

  const handleSubjectsChange = (values: ISelectItem[]) => {
    if (!selectedCourse) return;
    patchCourse(selectedCourse._id, { subjects: values.map((value) => value.value) });
  };

  const saveCourse = async () => {
    if (!selectedCourse) return;
    try {
      const validationError = getValidationError(selectedCourse, selectedCoursePlans, selectedFiles.length > 0);
      if (validationError) {
        errorToast({ message: validationError });
        return;
      }
      setIsLoading(true);
      const attachments = await uploadFilesToS3(selectedCourse._id, selectedFiles);
      attachments && patchCourse(selectedCourse._id, { attachments });
      calculateAndSetCourseStatsByCourseId(selectedCourse._id);
      await CourseService.upsertCourseAndPlans({ course: selectedCourse, plans: selectedCoursePlans });
      patchCourse(selectedCourse._id, { isNew: false });
      selectedCoursePlans.forEach((plan) => patchPlan(plan._id, { isNew: false }));
      successToast({ message: 'Course and plans created successfully.' });
      setTimeout(() => {
        push(
          { pathname: `/courses/${selectedCourse._id}`, query: { name: selectedCourse.name } },
          `/courses/${selectedCourse._id}`,
        );
      }, 500);
      setSelectedFiles([]);
      onClose();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (index: number) => {
    const files = [...selectedFiles];
    files.splice(index, 1);
    setSelectedFiles(files);
  };

  useEffect(() => {
    if (selectedCourse && !selectedCourse.isNew) loadCoursePlans(selectedCourse._id);
  }, [selectedCourseId]);

  return (
    <>
      <Modal
        position={PositionType.RIGHT}
        title="Create Course"
        isOpen={isOpen}
        isLoading={isLoading}
        onClose={closeModal}
        component={
          selectedCourse && (
            <div className="min-h-[60vh] pb-4">
              <div className="flex flex-col space-y-3">
                <TextInput
                  label="Course Name"
                  value={selectedCourse.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    patchCourse(selectedCourse._id, { name: e.target.value })
                  }
                  required
                />
                <TextArea
                  label="Course Description"
                  value={selectedCourse.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    patchCourse(selectedCourse._id, { description: e.target.value })
                  }
                />
                <Select
                  label="Standards"
                  items={getStandardItems()}
                  required
                  isGrouped
                  values={selectedCourse.standards ?? []}
                  onChange={handleStandardsChange}
                  isCloseOnSelect={true}
                />
                <Select
                  label="Subjects"
                  items={[...getCourseSubjectItems(selectedCourse._id), { label: 'All', value: ALL }]}
                  values={
                    (selectedCourse.subjects ?? []).length || selectedCourse.isNew
                      ? (selectedCourse.subjects ?? [])
                      : [ALL]
                  }
                  onChange={handleSubjectsChange}
                />
                <div>
                  <Label label="Course Image" required />
                  <div className="flex justify-center mt-1 w-full">
                    <div className="w-full border border-dotted border-color-border py-2 px-2">
                      <UploadFiles
                        selectedFiles={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
                        removeFile={removeFile}
                        isImage
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div>
                    <Label label="Plans" required />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {selectedCoursePlans.map((plan) => {
                      return (
                        <div key={plan._id} className="">
                          <div className="flex flex-col md:flex-row gap-2.5">
                            <div className="w-full md:w-[33.33%]">
                              <TextInput
                                label="Plan Name"
                                value={plan.name}
                                className="w-32"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  patchPlan(plan._id, { name: e.target.value })
                                }
                                required
                              />
                            </div>
                            <div className="w-full md:w-[33.33%]">
                              <TextInput
                                type="number"
                                label="Amount"
                                value={plan.amount === 0 ? '' : plan.amount}
                                className="w-32"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const intValue = parseInt(e.target.value);
                                  if (!isNaN(intValue)) patchPlan(plan._id, { amount: Math.abs(intValue) });
                                  else patchPlan(plan._id, { amount: 0 });
                                }}
                                required
                              />
                            </div>
                            <div className="w-full md:w-[33.33%]">
                              <TextInput
                                type="number"
                                label="Real Amount"
                                className="w-32"
                                value={plan.realAmount === 0 ? '' : plan.realAmount}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const intValue = parseInt(e.target.value);
                                  if (!isNaN(intValue)) patchPlan(plan._id, { realAmount: Math.abs(intValue) });
                                  else patchPlan(plan._id, { realAmount: 0 });
                                }}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        }
        footer={
          <ModalFooter
            saveText="Save"
            cancelText="Cancel"
            onSave={saveCourse}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        }
      />
    </>
  );
};
