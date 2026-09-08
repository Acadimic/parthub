import { Select } from '@components/app/selects';
import { Button, Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { PaperType, PositionType, SectionCategoryType, SectionType } from '@enums';
import { ISelectItem } from '@interfaces';
import { TestPaperService } from '@services';
import { DefaultMarkingType, ITestPaperSection, useStores } from '@stores';
import { ALL, defaultMarkings } from '@utils/constants';
import { getYears, successToast } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { DefaultMarkingsModal } from './DefaultMarkingsModal';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTestPaperModal = observer(({ isOpen, onClose }: IProps) => {
  const { push } = useRouter();
  const { selectorStore, standardStore, testPaperStore } = useStores();
  const { selectedTestPaper, setSelectedTestPaperId, setSelectedTestPaperSectionId } = selectorStore;
  const { standardItems, getStandardById, getSubjectById, getStandardsSubjectItems } = standardStore;
  const { removeTestPaper, createTestPaperSection, addTestPaper, getTestPaperSectionsByIds } = testPaperStore;
  const [isOpenMarkings, setIsOpenMarkings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [markings, setMarkings] = useState<DefaultMarkingType>(structuredClone(defaultMarkings));
  const [isVisibleMore, setIsVisibleMore] = useState(false);

  const closeModal = async () => {
    if (!selectedTestPaper) return;
    if (selectedTestPaper.isNew) removeTestPaper(selectedTestPaper._id);
    setSelectedTestPaperId('');
    setMarkings(structuredClone(defaultMarkings));
    setIsVisibleMore(false);
    onClose();
  };

  const openMarkingsModal = () => {
    setIsOpenMarkings(true);
  };

  const handleStandardsChange = (values: ISelectItem[]) => {
    if (!selectedTestPaper) return;
    selectedTestPaper.setStandards(values.map((value) => value.value));
  };

  const handleSubjectsChange = (values: ISelectItem[]) => {
    if (!selectedTestPaper) return;
    selectedTestPaper.setSubjects(values.map((value) => value.value));
  };

  const saveTestPaper = async () => {
    if (!selectedTestPaper) return;
    try {
      setIsLoading(true);
      let testPaperSections: ITestPaperSection[] = getTestPaperSectionsByIds(selectedTestPaper.sections);
      if (selectedTestPaper.isNew) {
        const isSubject = selectedTestPaper.subjects.length > 0;
        const ids = isSubject ? selectedTestPaper.subjects : selectedTestPaper.standards;
        testPaperSections = ids.map((id) => {
          const section = createTestPaperSection(SectionType.SECTION, SectionCategoryType.CUSTOM, markings);
          const obj = isSubject ? getSubjectById(id) : getStandardById(id);
          obj && section.setName(obj.name);
          return section;
        });
        const sectionIds = testPaperSections.map((section) => section._id);
        selectedTestPaper.setSections(sectionIds);
        await Promise.all(testPaperSections.map((section) => TestPaperService.upsertTestPaperSection(section)));
        testPaperSections.forEach((section) => section.resetIsNew());
      }
      const result = await TestPaperService.upsertTestPaper(selectedTestPaper);
      if (result.data) addTestPaper(result.data);
      selectedTestPaper.resetIsNew();
      setSelectedTestPaperSectionId(testPaperSections[0]._id);
      successToast({ message: 'Test paper created successfully.' });
      setTimeout(() => {
        push(
          { pathname: `/test-papers/${selectedTestPaper._id}`, query: { name: selectedTestPaper.name } },
          `/test-papers/${selectedTestPaper._id}`,
        );
      }, 500);
      setMarkings(structuredClone(defaultMarkings));
      onClose();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedTestPaper) return;
    const { standards, subjects, year } = selectedTestPaper;
    if (standards.length && year) {
      const standardNames = standardStore.getStandardsByIds(standards).map((standard) => standard.name);
      const subjectNames = standardStore.getSubjectsByIds(subjects).map((subject) => subject.name);
      let newName = `${standardNames.join(', ')}`;
      if (subjectNames.length) newName += ` - ${subjectNames.join(', ')}`;
      if (year) newName += ` - ${year}`;
      selectedTestPaper.setName(newName);
      setIsVisibleMore(true);
    }
  }, [selectedTestPaper?.standards.length, selectedTestPaper?.subjects.length, selectedTestPaper?.year]);

  return (
    <>
      <Modal
        position={PositionType.RIGHT}
        title="Create Test Paper"
        isOpen={isOpen}
        isLoading={isLoading}
        onClose={closeModal}
        component={
          selectedTestPaper && (
            <div className="min-h-[60vh] pb-4">
              <div className="flex flex-col space-y-3">
                <Select
                  label="Standards"
                  items={standardItems}
                  required
                  isGrouped
                  values={selectedTestPaper.standards}
                  onChange={handleStandardsChange}
                  isCloseOnSelect={selectedTestPaper.standards.length === 0}
                />
                <Select
                  label="Year"
                  items={getYears(15).map((year) => ({ label: year.toString(), value: year.toString() }))}
                  required
                  values={[selectedTestPaper.year.toString()]}
                  onChange={(values) => values[0] && selectedTestPaper.setYear(Number(values[0].value))}
                  isSingleSelect
                />
                <div className={`flex flex-col space-y-3 ${isVisibleMore ? 'visible' : 'hidden'}`}>
                  <Select
                    label="Subjects"
                    items={[...getStandardsSubjectItems(selectedTestPaper.standards), { label: 'All', value: ALL }]}
                    values={
                      selectedTestPaper.subjects.length || selectedTestPaper.isNew ? selectedTestPaper.subjects : [ALL]
                    }
                    onChange={handleSubjectsChange}
                  />
                  <Select
                    label="Paper Type"
                    items={Object.values(PaperType).map((item) => ({ label: item, value: item }))}
                    values={[selectedTestPaper.paperType]}
                    onChange={(values) => values[0] && selectedTestPaper.setPaperType(values[0].value as PaperType)}
                    isSingleSelect
                  />
                  <TextInput
                    label="Name"
                    value={selectedTestPaper.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => selectedTestPaper.setName(e.target.value)}
                    required
                  />
                  <TextInput
                    label="Duration (mins)"
                    value={selectedTestPaper.durationMins}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      selectedTestPaper.setDurationMins(Number(e.target.value))
                    }
                    required
                  />
                  <div className="py-2">
                    <Button
                      text="View | Modify Markings"
                      disabled={isLoading}
                      className="text-center w-full flex justify-center font-medium text-xs"
                      onClick={openMarkingsModal}
                    />
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
            onSave={saveTestPaper}
            onCancel={closeModal}
            isLoading={isLoading}
          />
        }
      />
      <DefaultMarkingsModal
        isOpen={isOpenMarkings}
        isLoading={isLoading}
        onClose={() => setIsOpenMarkings(false)}
        defaultMarkings={markings}
        onSave={(newMarkings) => setMarkings(newMarkings)}
      />
    </>
  );
});
