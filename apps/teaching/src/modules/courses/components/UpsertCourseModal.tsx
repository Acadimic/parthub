import { type CourseDto, type PlanDto } from '@repo/shared/contracts';
import { type AttachmentDto } from '@repo/shared/contracts';
import { Attachments, UploadFiles } from '@components/app/attachments';
import { Select } from '@components/app/selects';
import { Button, Label, Modal, ModalFooter, TextArea, TextInput } from '@repo/ui/app';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { PeriodType, PositionType } from '@enums';
import { type UploadProgress, useAttachment } from '@hooks/attachment.hook';
import { type ISelectItem } from '@interfaces';
import { CourseService } from '@services';
import {
  useCourseLookups,
  useCourseStore,
  useSelectedCourse,
  useSelectedCoursePlans,
  useSelectorLookups,
  useStandardLookups,
} from '@stores';
import { ALL, slugify } from '@repo/shared/utils';
import { errorToast, reportError, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

/** What the drawer restores when an edit is cancelled. */
interface ISnapshot {
  course: CourseDto;
  plans: PlanDto[];
}

/**
 * The first thing wrong with the course or its plans, as a message for the user, or undefined when
 * it is ready to save. Pure, so the save handler holds the sequence and not the rules.
 */
const getValidationError = (course: CourseDto, plans: PlanDto[], hasNewFiles: boolean): string | undefined => {
  if (course.name.trim() === '') return 'Please enter a valid course name.';
  // The public link is made from the name's English letters and digits; with none it would be empty.
  if (slugify(course.name) === '') return 'Course name must contain at least one English letter or number.';
  if ((course.standards ?? []).length === 0) return 'Please select at least one standard.';
  if ((course.attachments ?? []).length === 0 && !hasNewFiles) return 'Please add at least one course image.';
  if (plans.length === 0) return 'Please add at least one plan.';
  for (const plan of plans) {
    if (plan.name.trim() === '') return 'Please enter a valid plan name.';
    // An amount of 0 is a free plan, which the learning app enrols in without a payment.
    if (plan.amount > (plan.realAmount ?? 0)) return 'Real amount should be greater than or equal to amount.';
  }
  return undefined;
};

/** An amount input's value, floored at zero and keeping the decimals `parseInt` used to drop. */
const toAmount = (value: string): number => {
  const amount = Number(value);
  return isNaN(amount) ? 0 : Math.max(0, amount);
};

export const UpsertCourseModal = ({ isOpen, onClose }: IProps) => {
  const { push } = useRouter();
  const courseStore = useCourseLookups();
  const { patchCourse, patchPlan, getCourseSubjectItems, createPlan, removePlanById } = courseStore;
  const { addCourses, addPlans, restoreCourse, removeCourseById, loadCoursePlans } = courseStore;
  const { selectedCourseId, removeSelectedCourseId } = useSelectorLookups();
  const selectedCoursePlans = useSelectedCoursePlans();
  const selectedCourse = useSelectedCourse();
  const { getStandardItems } = useStandardLookups();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  // The saved image removed while editing. Its object is deleted only once the save has gone
  // through, so cancelling leaves the course's image where it was.
  const [removedAttachments, setRemovedAttachments] = useState<AttachmentDto[]>([]);
  const [removedPlanIds, setRemovedPlanIds] = useState<string[]>([]);
  // The saved course and plans as they were when the drawer opened. Editing patches the store as
  // the user types, so cancelling has to have something to put back.
  const snapshotRef = useRef<ISnapshot | undefined>(undefined);
  const { uploadFilesToS3, deleteAttachments } = useAttachment();

  const isNewCourse = !!selectedCourse?.isNew;
  const visiblePlans = selectedCoursePlans.filter((plan) => !removedPlanIds.includes(plan._id));

  const resetAndClose = () => {
    snapshotRef.current = undefined;
    setRemovedPlanIds([]);
    setRemovedAttachments([]);
    setSelectedFiles([]);
    removeSelectedCourseId();
    onClose();
  };

  const closeModal = () => {
    if (isLoading) return;
    const course = selectedCourse;
    if (course?.isNew) {
      // The draft and the two plans created with it exist only here; nothing has seen them.
      removeCourseById(course._id);
      selectedCoursePlans.forEach((plan) => removePlanById(plan._id));
    } else if (snapshotRef.current) {
      restoreCourse(snapshotRef.current.course);
      addPlans(snapshotRef.current.plans);
    }
    resetAndClose();
  };

  const handleStandardsChange = (values: ISelectItem[]) => {
    if (!selectedCourse) return;
    patchCourse(selectedCourse._id, { standards: values.map((value) => value.value) });
  };

  const handleSubjectsChange = (values: ISelectItem[]) => {
    if (!selectedCourse) return;
    patchCourse(selectedCourse._id, { subjects: values.map((value) => value.value) });
  };

  const addPlan = () => {
    if (!selectedCourse) return;
    createPlan(selectedCourse._id, selectedCoursePlans.length, PeriodType.MONTHLY);
  };

  const removePlan = (plan: PlanDto) => {
    // An unsaved plan can just go; a saved one has to be soft-deleted, which happens on save so the
    // course and its plans stay consistent even if the user cancels.
    if (plan.isNew) removePlanById(plan._id);
    else setRemovedPlanIds((planIds) => [...planIds, plan._id]);
  };

  /** Takes a failed save's uploads back out of the draft and the bucket. */
  const discardUploads = async (courseId: string, uploaded: AttachmentDto[]) => {
    if (!uploaded.length) return;
    const keys = uploaded.map((attachment) => attachment.key);
    const latest = useCourseStore.getState().getCourseById(courseId);
    patchCourse(courseId, {
      attachments: (latest?.attachments ?? []).filter((attachment) => !keys.includes(attachment.key)),
    });
    await deleteAttachments(uploaded);
  };

  const saveCourse = async () => {
    const courseId = selectedCourse?._id;
    if (!courseId) return;
    const store = useCourseStore.getState();
    const currentCourse = store.getCourseById(courseId);
    if (!currentCourse) return;
    const validationError = getValidationError(currentCourse, visiblePlans, selectedFiles.length > 0);
    if (validationError) {
      errorToast({ message: validationError });
      return;
    }
    const isCreating = !!currentCourse.isNew;
    // Uploaded before the record is written and deleted again if that write fails, so the bucket
    // never holds an image that no saved course points at.
    let uploaded: AttachmentDto[] = [];
    try {
      setIsLoading(true);
      setUploadProgress({});
      uploaded = await uploadFilesToS3(courseId, selectedFiles, (index, percent) =>
        setUploadProgress((current) => ({ ...current, [index]: percent })),
      );
      if (uploaded.length) patchCourse(courseId, { attachments: [...(currentCourse.attachments ?? []), ...uploaded] });
      // No stats recompute here: nothing in this form changes them, and from the courses table the
      // course's modules are not loaded, so a recompute would save every count as zero.
      // Read the rows back rather than posting `selectedCourse`: the store holds immutable rows, so
      // the copy captured during render does not carry the upload above.
      const fresh = useCourseStore.getState();
      const course = fresh.getCourseById(courseId);
      if (!course) return;
      const plans: PlanDto[] = [
        ...fresh.getPlansByCourseId(courseId).filter((plan) => !removedPlanIds.includes(plan._id)),
        ...removedPlanIds
          .map((planId) => fresh.getPlanById(planId))
          .filter((plan): plan is PlanDto => !!plan)
          .map((plan) => ({ ...plan, _deleted: true })),
      ];
      const result = await CourseService.upsertCourseAndPlans({
        // Picking the "All" item clears the selection, but a row saved before that did could still
        // carry the sentinel, and the server validates every id as a MongoId.
        // The slug, the course's public address, follows the name. A name another course already
        // has is refused by the server's unique index, and its 409 is toasted by `handleError`.
        course: {
          ...course,
          slug: slugify(course.name),
          subjects: (course.subjects ?? []).filter((subjectId) => subjectId !== ALL),
        },
        plans,
      });
      if (result?.data) {
        // The saved rows are merged over the drafts, which clears `isNew` (the server never sends it)
        // and brings the server's own fields (org, timestamps) into the store.
        addCourses([result.data.course]);
        addPlans(result.data.plans);
      }
      removedPlanIds.forEach((planId) => removePlanById(planId));
      // Only now is the replaced image gone for good: the record no longer refers to it.
      await deleteAttachments(removedAttachments);
      successToast({ message: isCreating ? 'Course created.' : 'Course updated.' });
      resetAndClose();
      // A new course opens on its detail page, which is where its modules are added.
      if (isCreating) push(`/courses/${courseId}`);
    } catch (error) {
      await discardUploads(courseId, uploaded);
      reportError(error, 'Could not save the course.');
    } finally {
      setIsLoading(false);
      setUploadProgress({});
    }
  };

  const onRemoveAttachment = (attachment: AttachmentDto) => {
    if (!selectedCourse) return;
    patchCourse(selectedCourse._id, {
      attachments: (selectedCourse.attachments ?? []).filter((item) => item.key !== attachment.key),
    });
    if (attachment.isUploaded) setRemovedAttachments((current) => [...current, attachment]);
  };

  const removeFile = (index: number) => {
    const files = [...selectedFiles];
    files.splice(index, 1);
    setSelectedFiles(files);
  };

  useEffect(() => {
    const loadAndSnapshot = async () => {
      const course = useCourseStore.getState().getCourseById(selectedCourseId);
      if (!course || course.isNew) {
        snapshotRef.current = undefined;
        return;
      }
      // Snapshot after the plans land, or cancelling would restore an empty plan list.
      await loadCoursePlans(course._id);
      const store = useCourseStore.getState();
      snapshotRef.current = structuredClone({
        course: store.getCourseById(course._id) ?? course,
        plans: store.getPlansByCourseId(course._id),
      });
    };
    loadAndSnapshot();
  }, [selectedCourseId]);

  return (
    <Modal
      position={PositionType.RIGHT}
      title={isNewCourse ? 'Create Course' : 'Edit Course'}
      description="A course groups modules of study material, test papers and live sessions."
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
                disabled={isLoading}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  patchCourse(selectedCourse._id, { name: e.target.value })
                }
                required
              />
              {selectedCourse.slug ? (
                <p className="-mt-1 text-xs text-muted-foreground">
                  Renaming changes the course’s public link; links already shared will stop working.
                </p>
              ) : null}
              <TextArea
                label="Course Description"
                value={selectedCourse.description || ''}
                disabled={isLoading}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  patchCourse(selectedCourse._id, { description: e.target.value })
                }
              />
              <Select
                label="Standards"
                items={getStandardItems()}
                required
                isGrouped
                isDisabled={isLoading}
                values={selectedCourse.standards ?? []}
                onChange={handleStandardsChange}
                isCloseOnSelect={true}
              />
              <Select
                label="Subjects"
                items={[...getCourseSubjectItems(selectedCourse._id), { label: 'All', value: ALL }]}
                isDisabled={isLoading}
                values={
                  (selectedCourse.subjects ?? []).length || selectedCourse.isNew
                    ? (selectedCourse.subjects ?? [])
                    : [ALL]
                }
                onChange={handleSubjectsChange}
              />
              <div>
                <Label label="Course Image" required />
                <div className="mt-1 flex w-full flex-col gap-2">
                  <Attachments attachments={selectedCourse.attachments ?? []} onRemove={onRemoveAttachment} />
                  <UploadFiles
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                    removeFile={removeFile}
                    progress={isLoading ? uploadProgress : undefined}
                    isUploading={isLoading}
                    isImage
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label label="Plans" required />
                  <Button
                    isSubtle
                    className="px-2 py-1"
                    disabled={isLoading}
                    leftsection={<PlusIcon weight="bold" className="w-4 h-4" />}
                    onClick={addPlan}
                  >
                    Add plan
                  </Button>
                </div>
                <div className="flex flex-col gap-2.5">
                  {visiblePlans.map((plan) => {
                    return (
                      <div key={plan._id} className="flex items-end gap-2">
                        <div className="flex flex-1 flex-col md:flex-row gap-2.5">
                          <div className="w-full md:w-[33.33%]">
                            <TextInput
                              label="Plan Name"
                              value={plan.name}
                              className="w-32"
                              disabled={isLoading}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                patchPlan(plan._id, { name: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="w-full md:w-[33.33%]">
                            <TextInput
                              type="number"
                              min={0}
                              label="Amount"
                              value={plan.amount}
                              className="w-32"
                              disabled={isLoading}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                patchPlan(plan._id, { amount: toAmount(e.target.value) })
                              }
                              required
                            />
                          </div>
                          <div className="w-full md:w-[33.33%]">
                            <TextInput
                              type="number"
                              min={0}
                              label="Real Amount"
                              className="w-32"
                              value={plan.realAmount ?? 0}
                              disabled={isLoading}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                patchPlan(plan._id, { realAmount: toAmount(e.target.value) })
                              }
                              required
                            />
                          </div>
                        </div>
                        <Button
                          isSubtle
                          className="px-2 py-2"
                          title={`Remove ${plan.name || 'plan'}`}
                          disabled={isLoading}
                          onClick={() => removePlan(plan)}
                        >
                          <TrashIcon weight="bold" className="w-4 h-4" />
                        </Button>
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
          saveText={isNewCourse ? 'Create Course' : 'Save Changes'}
          cancelText="Cancel"
          onSave={saveCourse}
          onCancel={closeModal}
          isLoading={isLoading}
        />
      }
    />
  );
};
