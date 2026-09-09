import { Select } from '@components/app/selects';
import { Label, Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { HorizontalLineWithText } from '@components/others';
import { PositionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { CourseService } from '@services';
import {
  useStandardLookups,
  useCourseLookups,
  useMaterialLookups,
  useMeetLookups,
  useSelectedCourse,
  useSelectedCourseModule,
  useSelectorLookups,
  useTestPaperLookups,
} from '@stores';
import { getFrequencyText, successToast } from '@utils/helpers';
import { useState } from 'react';
import { CourseModuleView } from './CourseModuleView';
import { SessionsView } from './SessionsView';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  const { removeCourseModuleById, calculateAndSetCourseStatsByCourseId } = courseStore;
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
    if (!selectedCourseModule || !selectedCourse) return;
    try {
      setIsLoading(true);
      calculateAndSetCourseStatsByCourseId(selectedCourse._id);
      await CourseService.upsertCourseModule(selectedCourseModule);
      await CourseService.upsertCourse(selectedCourse);
      patchCourseModule(selectedCourseModule._id, { isNew: false });
      removeSelectedCourseModuleId();
      successToast({ message: 'Module added successfully.' });
      onClose();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        position={PositionType.RIGHT}
        title={`Add Module ${selectedCourseModule?.day}`}
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
                    <div className="border border-color-border mt-8 pt-4 pb-8 px-4">
                      <Label label="Course Preview" required />
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
