import { type TestPaperDto } from '@repo/shared/contracts';
import { type DefaultMarkingType } from '@repo/shared/interfaces';
import { Select } from '@components/app/selects';
import { Button, Modal, ModalFooter, TextInput } from '@repo/ui/app';
import { PaperType, PositionType, SectionCategoryType, SectionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { TestPaperService } from '@services';
import {
  type ITestPaperSection,
  useStandardLookups,
  useSelectedTestPaper,
  useSelectorLookups,
  useTestPaperLookups,
  useTestPaperStore,
} from '@stores';
import { defaultMarkings } from '@utils/constants';
import { errorToast, getYears, reportError, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { DefaultMarkingsModal } from './DefaultMarkingsModal';
import { ALL } from '@repo/shared/utils';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A `Select`'s current value, or none while the field is unset — `TestPaperDto` leaves `year` and
 * `paperType` optional because a write body need not send them. Outside the component so the
 * guards do not count against the render function's complexity.
 */
const toValues = (value: string | number | undefined): string[] => (value ? [String(value)] : []);

/**
 * The first thing wrong with the paper, or `null` when it can be saved.
 *
 * First failure wins, in the order the fields are laid out, so the message always names the field
 * nearest the top of the form. The server rejects an empty name and a missing standard outright;
 * the duration check is the client's own, because a fractional or negative one validates as a
 * number and then reads as nonsense on the exam screen.
 */
/** Whether the paper is still a draft — the one thing the dialog's wording and behaviour turn on. */
const isDraft = (testPaper?: TestPaperDto): boolean => !!testPaper?.isNew;

/**
 * Whether the rest of the form should be shown.
 *
 * The name is suggested from the standards and the year, so the fields below them stay hidden until
 * both are set; the form says so rather than leaving the reveal unexplained.
 */
const hasStandardsAndYear = (testPaper?: TestPaperDto): boolean =>
  !!(testPaper?.standards ?? []).length && !!testPaper?.year;

/** An empty subject list means every subject in the paper's standards, which the picker shows as "All". */
const toSubjectValues = (testPaper: TestPaperDto): string[] => {
  const subjects = testPaper.subjects ?? [];
  return subjects.length || testPaper.isNew ? subjects : [ALL];
};

const findProblem = (testPaper: TestPaperDto): string | null => {
  if (!(testPaper.standards ?? []).length) return 'Please select at least one standard.';
  if (!testPaper.year) return 'Please select a year.';
  if (!testPaper.name.trim()) return 'Please enter a name.';
  const duration = Number(testPaper.durationMins);
  if (!Number.isInteger(duration) || duration <= 0) return 'Duration must be a whole number of minutes.';
  return null;
};

export const CreateTestPaperModal = ({ isOpen, onClose }: IProps) => {
  const { push } = useRouter();
  const selectorStore = useSelectorLookups();
  const testPaperStore = useTestPaperLookups();
  const { patchTestPaperSection } = testPaperStore;
  const { patchTestPaper } = testPaperStore;
  const { setSelectedTestPaperId, setSelectedTestPaperSectionId } = selectorStore;
  const selectedTestPaper = useSelectedTestPaper();
  const standardStore = useStandardLookups();
  const { getStandardItems, getStandardById, getSubjectById, getStandardsSubjectItems } = standardStore;
  const { removeTestPaper, createTestPaperSection, addTestPapers, getTestPaperSectionsByIds } = testPaperStore;
  const [isOpenMarkings, setIsOpenMarkings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [markings, setMarkings] = useState<DefaultMarkingType>(structuredClone(defaultMarkings));
  // Once the author has touched the name it is theirs, and the suggestion stops overwriting it.
  const [hasTypedName, setHasTypedName] = useState(false);
  /**
   * The paper as it was when the dialog opened, for Cancel to put back.
   *
   * Every field is edited straight into the store, so without this an edit is already applied by
   * the time the author decides against it — Cancel would only stop the save, not the change.
   */
  const snapshot = useRef<TestPaperDto | null>(null);
  const isNew = isDraft(selectedTestPaper);
  // Derived during render rather than held in state: the block appears the moment both fields are
  // set, and reappears correctly when the dialog is opened on a paper that already has them.
  const isVisibleMore = hasStandardsAndYear(selectedTestPaper);

  const closeModal = () => {
    if (isLoading || !selectedTestPaper) return;
    if (isNew) {
      removeTestPaper(selectedTestPaper._id);
      setSelectedTestPaperId('');
    } else if (snapshot.current) {
      addTestPapers([snapshot.current]);
    }
    snapshot.current = null;
    setMarkings(structuredClone(defaultMarkings));
    setHasTypedName(false);
    onClose();
  };

  const openMarkingsModal = () => {
    setIsOpenMarkings(true);
  };

  const handleStandardsChange = (values: ISelectItem[]) => {
    if (!selectedTestPaper) return;
    patchTestPaper(selectedTestPaper._id, { standards: values.map((value) => value.value) });
  };

  const handleSubjectsChange = (values: ISelectItem[]) => {
    if (!selectedTestPaper) return;
    patchTestPaper(selectedTestPaper._id, { subjects: values.map((value) => value.value) });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTestPaper) return;
    setHasTypedName(true);
    patchTestPaper(selectedTestPaper._id, { name: e.target.value });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTestPaper) return;
    // A cleared field is `Number('')`, which is 0 rather than NaN — the store never holds a NaN, so
    // the validation above is what reports it instead of the server rejecting an unserialisable body.
    const durationMins = Number(e.target.value);
    patchTestPaper(selectedTestPaper._id, { durationMins: Number.isFinite(durationMins) ? durationMins : 0 });
  };

  /** One section per subject, or per standard, so a new paper is never saved with none. */
  const createSectionsForNewPaper = (testPaper: TestPaperDto): ITestPaperSection[] => {
    const isSubject = (testPaper.subjects ?? []).length > 0;
    const ids = isSubject ? (testPaper.subjects ?? []) : (testPaper.standards ?? []);
    // A section-less paper is a dead end in the UI, so `[undefined]` makes the map below run
    // exactly once and fall through to its `Section 1` fallback name.
    const sectionSources: (string | undefined)[] = ids.length ? ids : [undefined];
    return sectionSources.map((id, index) => {
      // The name goes in at creation. Patching it afterwards updated the store but left the local
      // `section` on the pre-patch copy — rows are immutable — so the post sent `name: ''` and the
      // server rejected it with "name should not be empty".
      const lookup = isSubject ? getSubjectById : getStandardById;
      const obj = id ? lookup(id) : undefined;
      return createTestPaperSection(
        SectionType.SECTION,
        SectionCategoryType.CUSTOM,
        markings,
        obj?.name || `Section ${index + 1}`,
      );
    });
  };

  const saveTestPaper = async () => {
    if (!selectedTestPaper) return;
    const problem = findProblem(selectedTestPaper);
    if (problem) {
      errorToast({ message: problem });
      return;
    }
    const isNewPaper = isNew;
    try {
      setIsLoading(true);
      let testPaperSections: ITestPaperSection[] = getTestPaperSectionsByIds(selectedTestPaper.sections ?? []);
      if (isNewPaper) {
        testPaperSections = createSectionsForNewPaper(selectedTestPaper);
        patchTestPaper(selectedTestPaper._id, { sections: testPaperSections.map((section) => section._id) });
        await Promise.all(testPaperSections.map((section) => TestPaperService.upsertTestPaperSection(section)));
        testPaperSections.forEach((section) => patchTestPaperSection(section._id, { isNew: false }));
      }
      // Re-read before posting. `patchTestPaper` above wrote the section ids into the store, but
      // rows are immutable — `selectedTestPaper` is still the pre-patch copy, so posting it sent
      // `sections: []` and the paper came back with none of the sections it had just created.
      const paperToSave = useTestPaperStore.getState().getTestPaperById(selectedTestPaper._id) ?? selectedTestPaper;
      const result = await TestPaperService.upsertTestPaper(paperToSave);
      if (result?.data) addTestPapers([result.data]);
      patchTestPaper(selectedTestPaper._id, { isNew: false });
      snapshot.current = null;
      // Guarded: editing a paper that somehow has no sections used to throw here, and the empty
      // `catch` below swallowed it — the drawer just sat there.
      if (testPaperSections[0]) setSelectedTestPaperSectionId(testPaperSections[0]._id);
      successToast({ message: `Test paper ${isNewPaper ? 'created' : 'updated'} successfully.` });
      setMarkings(structuredClone(defaultMarkings));
      setHasTypedName(false);
      onClose();
      // Only a brand-new paper goes to its detail screen. Editing one from that screen would push
      // the route it is already on, and editing from the list would navigate away unasked.
      if (isNewPaper) {
        push(
          { pathname: `/test-papers/${selectedTestPaper._id}`, query: { name: paperToSave.name } },
          `/test-papers/${selectedTestPaper._id}`,
        );
      }
    } catch (error) {
      reportError(error, 'Could not save the test paper.');
    } finally {
      setIsLoading(false);
    }
  };

  // Taken once per opening, and only for a saved paper: a draft is discarded outright on cancel.
  useEffect(() => {
    if (!isOpen || !selectedTestPaper || selectedTestPaper.isNew) return;
    if (snapshot.current?._id !== selectedTestPaper._id) snapshot.current = structuredClone(selectedTestPaper);
  }, [isOpen, selectedTestPaper?._id]);

  useEffect(() => {
    // Only while the paper is a draft, and only until the author types: the suggestion used to run
    // for saved papers too, silently renaming whichever paper was selected.
    if (!selectedTestPaper || !selectedTestPaper.isNew || hasTypedName) return;
    const { standards = [], subjects = [], year } = selectedTestPaper;
    if (!standards.length || !year) return;
    const subjectNamesText = standardStore.getSubjectNamesText(subjects);
    let newName = standardStore.getStandardNamesText(standards);
    if (subjectNamesText) newName += ` - ${subjectNamesText}`;
    newName += ` - ${year}`;
    patchTestPaper(selectedTestPaper._id, { name: newName });
  }, [
    selectedTestPaper?.standards?.length,
    selectedTestPaper?.subjects?.length,
    selectedTestPaper?.year,
    hasTypedName,
  ]);

  return (
    <>
      <Modal
        position={PositionType.RIGHT}
        title={isNew ? 'Create Test Paper' : 'Edit Test Paper'}
        description="Pick the standards and year first; the name is suggested from them."
        isOpen={isOpen}
        isLoading={isLoading}
        onClose={closeModal}
        component={
          selectedTestPaper && (
            <div className="min-h-[60vh] pb-4">
              <div className="flex flex-col space-y-3">
                <Select
                  label="Standards"
                  items={getStandardItems()}
                  required
                  isGrouped
                  values={selectedTestPaper.standards ?? []}
                  onChange={handleStandardsChange}
                  isCloseOnSelect={(selectedTestPaper.standards ?? []).length === 0}
                />
                <Select
                  label="Year"
                  items={getYears(15).map((year) => ({ label: year.toString(), value: year.toString() }))}
                  required
                  values={toValues(selectedTestPaper.year)}
                  onChange={(values) =>
                    values[0] && patchTestPaper(selectedTestPaper._id, { year: Number(values[0].value) })
                  }
                  isSingleSelect
                />
                {isVisibleMore ? (
                  <div className="flex flex-col space-y-3">
                    <Select
                      label="Subjects"
                      items={[
                        ...getStandardsSubjectItems(selectedTestPaper.standards ?? []),
                        { label: 'All', value: ALL },
                      ]}
                      values={toSubjectValues(selectedTestPaper)}
                      onChange={handleSubjectsChange}
                    />
                    <Select
                      label="Paper Type"
                      items={Object.values(PaperType).map((item) => ({ label: item, value: item }))}
                      values={toValues(selectedTestPaper.paperType)}
                      onChange={(values) =>
                        values[0] && patchTestPaper(selectedTestPaper._id, { paperType: values[0].value as PaperType })
                      }
                      isSingleSelect
                    />
                    <TextInput label="Name" value={selectedTestPaper.name} onChange={handleNameChange} required />
                    <TextInput
                      label="Duration (mins)"
                      type="number"
                      min={1}
                      value={selectedTestPaper.durationMins ?? ''}
                      onChange={handleDurationChange}
                      required
                    />
                    <div className="py-2">
                      <Button
                        text="View or modify markings"
                        isSecondary
                        disabled={isLoading}
                        onClick={openMarkingsModal}
                      />
                    </div>
                  </div>
                ) : (
                  // The block above used to appear with no explanation of what unlocked it.
                  <p className="text-xs text-muted-foreground">Choose standards and a year to continue.</p>
                )}
              </div>
            </div>
          )
        }
        footer={
          <ModalFooter
            saveText={isNew ? 'Create' : 'Save'}
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
};
