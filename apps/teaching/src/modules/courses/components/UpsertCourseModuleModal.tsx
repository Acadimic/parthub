import { Select } from '@components/app/selects';
import { Label, Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { HorizontalLineWithText } from '@components/others';
import { PositionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { CourseService } from '@services';
import {
  type ICourseModule,
  useStandardLookups,
  useCourseLookups,
  useCourseStore,
  useMaterialLookups,
  useMeetLookups,
  useSelectedCourse,
  useSelectedCourseModule,
  useSelectorLookups,
  useTestPaperLookups,
} from '@stores';
import { getFrequencyText, reportError, successToast } from '@utils/helpers';
import { useState } from 'react';
import { CourseModuleView } from './CourseModuleView';
import { SessionsView } from './SessionsView';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

/** "Add Module 3" while the module is still a draft, "Edit Module 3" once the server has it. */
const getTitle = (courseModule?: ICourseModule): string =>
  `${courseModule?.isNew ? 'Add' : 'Edit'} Module ${courseModule?.day ?? ''}`.trim();

export const UpsertCourseModuleModal = ({ isOpen, onClose }: IProps) => {
  const selectorStore = useSelectorLookups();
  const courseStore = useCourseLookups();
  const { patchCourse } = courseStore;
  const { renameCourseModule } = courseStore;
  const { patchCourseModule } = courseStore;
  const materialStore = useMaterialLookups();
  const testPaperStore = useTestPaperLookups();
  const meetStore = useMeetLookups();
  const { removeSelectedCourseModuleId } = selectorStore;
  const selectedCourseModule = useSelectedCourseModule();
  const selectedCourse = useSelectedCourse();
  const { getTestPapersByStandardIds } = testPaperStore;
  const { getSubjectById } = useStandardLookups();
  const { removeCourseModuleById, calculateAndSetCourseStatsByCourseId, addCourseModules, addCourses } = courseStore;
  const { getMaterialsByStandardIds } = materialStore;
  const meets = meetStore.getMeets();
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = async () => {
    if (selectedCourseModule?.isNew) removeCourseModuleById(selectedCourseModule._id);
    removeSelectedCourseModuleId();
    onClose();
  };

  const handleMaterialsChange = (values: ISelectItem[]) => {
    if (!selectedCourseModule) return;
    patchCourseModule(selectedCourseModule._id, { materials: values.map((value) => value.value) });
  };

  const handleTestPapersChange = (values: ISelectItem[]) => {
    if (!selectedCourseModule) return;
    patchCourseModule(selectedCourseModule._id, { testPapers: values.map((value) => value.value) });
  };

  const handleMeetsChange = (values: ISelectItem[]) => {
    if (!selectedCourse) return;
    patchCourse(selectedCourse._id, { meets: values.map((value) => value.value) });
  };

  const saveCourseModule = async () => {
    const courseModuleId = selectedCourseModule?._id;
    const courseId = selectedCourse?._id;
    if (!courseModuleId || !courseId) return;
    const isCreating = !!selectedCourseModule?.isNew;
    try {
      setIsLoading(true);
      calculateAndSetCourseStatsByCourseId(courseId);
      // Read both rows back rather than posting the copies captured during render: the store holds
      // immutable rows, so neither the last keystroke nor the stats just computed are on them.
      const store = useCourseStore.getState();
      const courseModule = store.getCourseModuleById(courseModuleId);
      const course = store.getCourseById(courseId);
      if (!courseModule || !course) return;
      const moduleResult = await CourseService.upsertCourseModule(courseModule);
      const courseResult = await CourseService.upsertCourse(course);
      // The saved rows replace the drafts, which is what clears `isNew` and brings the server's own
      // fields into the store.
      if (moduleResult?.data) addCourseModules([moduleResult.data]);
      if (courseResult?.data) addCourses([courseResult.data]);
      removeSelectedCourseModuleId();
      successToast({ message: isCreating ? 'Module added.' : 'Module updated.' });
      onClose();
    } catch (error) {
      reportError(error, 'Could not save the module.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        position={PositionType.RIGHT}
        title={getTitle(selectedCourseModule)}
        isOpen={isOpen}
        isLoading={isLoading}
        onClose={closeModal}
        component={
          selectedCourse &&
          selectedCourseModule && (
            <div className="min-h-[60vh] pb-4">
              <div className="flex flex-col space-y-3">
                <TextInput
                  label="Name"
                  value={selectedCourseModule.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    renameCourseModule(selectedCourseModule._id, e.target.value)
                  }
                  required
                />
                <Select
                  label="Study Materials"
                  items={getMaterialsByStandardIds(selectedCourse.standards ?? []).map((material) => ({
                    label: material.name,
                    value: material._id,
                    group: material.subject ? getSubjectById(material.subject)?.name : undefined,
                  }))}
                  required
                  isGrouped
                  values={selectedCourseModule.materials ?? []}
                  onChange={handleMaterialsChange}
                  // isCloseOnSelect={true}
                />
                <Select
                  label="Test Papers"
                  items={getTestPapersByStandardIds(selectedCourse.standards ?? []).map((testPaper) => ({
                    label: testPaper.name,
                    value: testPaper._id,
                    group: testPaper.paperType,
                    description: `${testPaper.totalQuestions} questions ${testPaper.maxMarks} marks, ${testPaper.durationMins} mins`,
                  }))}
                  required
                  values={selectedCourseModule.testPapers ?? []}
                  onChange={handleTestPapersChange}
                />
                <HorizontalLineWithText text="Add Sessions" />
                <Select
                  label="Sessions"
                  items={meets.map((meet) => ({
                    label: meet.title,
                    value: meet._id,
                    group: meet.startTime ? getFrequencyText([...(meet.weekDays ?? [])], meet.startTime) : '',
                    description: meet.description,
                  }))}
                  required
                  values={selectedCourse.meets ?? []}
                  onChange={handleMeetsChange}
                  isGrouped
                />
                {(selectedCourseModule.materials ?? []).length || (selectedCourseModule.testPapers ?? []).length ? (
                  <div className="">
                    <div className="border border-border mt-8 pt-4 pb-8 px-4">
                      <Label label="Course Preview" />
                      <div>
                        <CourseModuleView courseModule={selectedCourseModule} />
                      </div>
                      <div>
                        <SessionsView course={selectedCourse} />
                      </div>
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
};
