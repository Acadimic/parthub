import { defaultMarkings } from '@utils/constants';
import { type QuestionDto, type TestPaperDto } from '@repo/shared/contracts';
import { Button, Card, Modal, ModalFooter, SoftConfirmModal } from '@repo/ui/app';
import { PencilIcon, PlusIcon, SparkleIcon, TrashIcon } from '@phosphor-icons/react';
import { BlankState } from '@components/others';
import { PositionType, SectionCategoryType, SectionType } from '@enums';
import { type IMenuItem } from '@interfaces';
import { QuestionService, TestPaperService } from '@services';
import {
  type ITestPaperSection,
  useStandardLookups,
  useStandardStore,
  useQuestionStore,
  useSelectedTestPaper,
  useSelectedTestPaperSection,
  useSelectorLookups,
  useSelectorStore,
  useTestPaperLookups,
  useTestPaperStore,
} from '@stores';
import { errorToast, reportError, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import {
  CreateTestPaperModal,
  AiTestPaperDrawer,
  QuestionSteps,
  SectionCard,
  TestPaperDetails,
  TestPaperSkeleton,
  UpsertQuestionFooter,
  UpsertTestPaperSection,
} from './components';

interface IProps {
  testPaperId: string;
}

interface IState {
  isOpenUpsertQuestion: boolean;
  isOpenAi: boolean;
  /** The section whose Generate opened the AI drawer, or null for the whole paper. */
  aiSectionId: string | null;
  isOpenEditPaper: boolean;
  isLoading: boolean;
  /**
   * The id of the section the drawer is editing, or `null` while it is closed. The id and not the
   * row: the form patches the store as the author types, and a copy held here would stay as it was
   * when the drawer opened — the name field used to ignore every keystroke for exactly that reason.
   */
  sectionId: string | null;
  /** A saved section as it was when its drawer opened, so Cancel can put it back. */
  sectionBackup: ITestPaperSection | null;
  isOpenAddSection: boolean;
  /** The section the delete confirm is asking about, or `null` while it is closed. */
  sectionToDelete: ITestPaperSection | null;
  questionToDelete: QuestionDto | null;
  isDeleting: boolean;
}

/** The title an upsert modal shows, which depends only on whether the row is still a draft. */
const getUpsertTitle = (isNew: boolean | undefined, noun: string) => `${isNew ? 'Create New' : 'Update'} ${noun}`;

/**
 * The sections the header should count. The loaded list is the truth once it is in; until then
 * the paper's own id list stands in, so the tile does not show 0 and jump.
 */
const countSections = (paper: TestPaperDto, loadedCount: number, isLoading: boolean) =>
  isLoading && loadedCount === 0 ? (paper.sections?.length ?? 0) : loadedCount;

/** The section drawer, with its title and primary action worded for a draft or a saved row. */
const SectionDrawer = ({
  section,
  isOpen,
  isLoading,
  onClose,
  onSave,
}: {
  section: ITestPaperSection | undefined;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: () => void;
}) => (
  <Modal
    position={PositionType.RIGHT}
    className="w-full md:w-[36rem] md:max-w-[90%]"
    title={section?.isNew ? 'New section' : 'Edit section'}
    description="Name the section and set what its questions are worth by default."
    isOpen={isOpen && !!section}
    onClose={onClose}
    component={section && <UpsertTestPaperSection section={section} isLoading={isLoading} />}
    footer={
      <ModalFooter
        saveText={section?.isNew ? 'Create section' : 'Save changes'}
        onCancel={onClose}
        onSave={onSave}
        isLoading={isLoading}
      />
    }
  />
);

/** The screen when there is no paper to show: the list failed to load, or the id matches nothing. */
const PaperMissing = ({
  error,
  onRetry,
  onBack,
}: {
  /** The load error, when there was one; absent, the paper simply does not exist. */
  error?: string;
  onRetry: () => void;
  onBack: () => void;
}) => (
  <BlankState
    label={error ? 'Could not load this paper' : 'Paper not found'}
    description={error ?? 'It may have been deleted, or the link is wrong.'}
    className="py-16"
    action={
      <div className="flex gap-2">
        {error ? <Button text="Retry" onClick={onRetry} /> : null}
        <Button isSecondary text="Back to test papers" onClick={onBack} />
      </div>
    }
  />
);

export const TestPaper = ({ testPaperId }: IProps) => {
  const testPaperStore = useTestPaperLookups();
  const { getSectionQuestions, patchTestPaperSection, removeTestPaperSection, reloadTestPaper } = testPaperStore;
  const { patchTestPaper } = testPaperStore;
  const selectorStore = useSelectorLookups();
  const {
    setSelectedTestPaperSectionId,
    selectedQuestionType,
    selectedQuestionId,
    setSelectedUpsertQuestionStep,
    removeSelectedQuestionId,
    setSelectedQuestionId,
    setSelectedTestPaperId,
  } = selectorStore;
  const selectedTestPaperSection = useSelectedTestPaperSection();
  const selectedTestPaper = useSelectedTestPaper();
  // Stable actions and one boolean, not the lookups: the drawer patches the open question on every
  // keystroke, and this screen re-renders every section and card below it.
  const createQuestion = useQuestionStore((state) => state.createQuestion);
  const removeQuestionById = useQuestionStore((state) => state.removeQuestionById);
  const isNewQuestion = useQuestionStore((state) => !!state.questionMap[selectedQuestionId]?.isNew);
  const {
    getTestPaperSectionById,
    getTestPaperSectionsByIds,
    loadTestPaperSectionsWithQuestions,
    createTestPaperSection,
    loadTestPapers,
  } = testPaperStore;
  const isLoadingTestPapers = testPaperStore.isLoading('testPapers');
  const isLoadingTestPaperSections = testPaperStore.isLoading('testPaperSections');
  const { loadOrgChapters } = useStandardLookups();
  const { push } = useRouter();
  const [state, setState] = useSetState<IState>({
    isOpenUpsertQuestion: false,
    isOpenAi: false,
    aiSectionId: null,
    isOpenEditPaper: false,
    isLoading: false,
    sectionId: null,
    sectionBackup: null,
    isOpenAddSection: false,
    sectionToDelete: null,
    questionToDelete: null,
    isDeleting: false,
  });
  const sections = selectedTestPaper ? getTestPaperSectionsByIds(selectedTestPaper.sections ?? []) : [];
  const editingSection = state.sectionId ? getTestPaperSectionById(state.sectionId) : undefined;
  const hasSections = sections.length !== 0;
  const isLoadingSections = isLoadingTestPaperSections || isLoadingTestPapers;

  const setLoading = (bool: boolean) => {
    setState({ isLoading: bool });
  };

  const onOpenAddQuestionModal = (sectionId: string) => {
    const section = getTestPaperSectionById(sectionId);
    if (!selectedTestPaper || !section) return;
    setSelectedTestPaperSectionId(sectionId);
    // Select it as well as create it: `AddQuestion` renders from `useSelectedQuestion()` and
    // returns null without one, so the modal opened with an empty body — no editor, no options.
    const question = createQuestion({
      standard: (selectedTestPaper.standards ?? [])[0],
      questionType: selectedQuestionType,
      section: sectionId,
      markings: section.defaultMarkings[selectedQuestionType],
    });
    setSelectedQuestionId(question._id);
    setSelectedUpsertQuestionStep(0);
    setState({ isOpenUpsertQuestion: true });
  };

  const onOpenAi = (sectionId: string | null) => {
    if (sectionId) setSelectedTestPaperSectionId(sectionId);
    setState({ isOpenAi: true, aiSectionId: sectionId });
  };

  const addNewSection = () => {
    // Falls back to the app defaults rather than bailing. It used to require an existing section to
    // copy markings from, which made a paper with none unrecoverable: the only way to add a section
    // was a menu item that did nothing, so neither sections nor questions could ever be created.
    const source = selectedTestPaperSection ?? sections[0];
    const newSection = createTestPaperSection(
      SectionType.SECTION,
      SectionCategoryType.CUSTOM,
      source?.defaultMarkings ?? structuredClone(defaultMarkings),
      `Section ${sections.length + 1}`,
    );
    setState({ sectionId: newSection._id, sectionBackup: null, isOpenAddSection: true });
  };

  const editSection = (section: ITestPaperSection) => {
    setState({ sectionId: section._id, sectionBackup: structuredClone(section), isOpenAddSection: true });
  };

  const editQuestion = (questionId: string, sectionId: string) => {
    if (!selectedTestPaper) return;
    setSelectedTestPaperSectionId(sectionId);
    setSelectedQuestionId(questionId);
    setSelectedUpsertQuestionStep(0);
    setState({ isOpenUpsertQuestion: true });
  };

  /**
   * A section is only removable once it is empty.
   *
   * Deleting it with questions still pointing at it would orphan them: `QuestionDto.section` is how
   * a paper finds its questions, so they would stay in the collection and be reachable from nothing.
   */
  const requestDeleteSection = (section: ITestPaperSection) => {
    if (getSectionQuestions(section._id).length) {
      errorToast({ message: 'Delete or move its questions first.' });
      return;
    }
    setState({ sectionToDelete: section });
  };

  const saveSection = async () => {
    const section = editingSection;
    if (!section || !selectedTestPaper) return;
    if (!section.name?.trim()) {
      errorToast({ message: 'Section name is required.' });
      return;
    }
    try {
      setState({ isLoading: true });
      const sectionIds = [...new Set([...(selectedTestPaper.sections ?? []), section._id])];
      if (section.isNew) patchTestPaper(selectedTestPaper._id, { sections: sectionIds });
      // Re-read for the same reason as `CreateTestPaperModal`: `patchTestPaper` has just added the
      // section id, and `selectedTestPaper` is the copy from before that patch.
      const paperToSave = useTestPaperStore.getState().getTestPaperById(selectedTestPaper._id) ?? selectedTestPaper;
      await Promise.all([
        section.isNew ? TestPaperService.upsertTestPaper(paperToSave) : Promise.resolve(),
        TestPaperService.upsertTestPaperSection(section),
      ]);
      patchTestPaperSection(section._id, { isNew: false });
      setState({ isOpenAddSection: false, sectionId: null, sectionBackup: null });
    } catch (error) {
      // Previously an empty `catch {}`: a rejected save left the drawer open with no explanation.
      reportError(error, 'Could not save the section.');
    } finally {
      setState({ isLoading: false });
    }
  };

  const deleteSection = async () => {
    const section = state.sectionToDelete;
    if (!section || !selectedTestPaper) return;
    try {
      setState({ isDeleting: true });
      await TestPaperService.upsertTestPaperSection({ ...section, _deleted: true });
      // The paper owns the ordering, so dropping the id from `sections` is a second write — the
      // section's own soft delete does not reach the papers referencing it.
      patchTestPaper(selectedTestPaper._id, {
        sections: (selectedTestPaper.sections ?? []).filter((id) => id !== section._id),
      });
      const paperToSave = useTestPaperStore.getState().getTestPaperById(selectedTestPaper._id) ?? selectedTestPaper;
      await TestPaperService.upsertTestPaper(paperToSave);
      removeTestPaperSection(section._id);
      successToast({ message: 'Section deleted successfully.' });
      setState({ sectionToDelete: null });
      // After the delete has been reported: a failed refresh is not a failed delete.
      await reloadTestPaper(selectedTestPaper._id);
    } catch (error) {
      reportError(error, 'Could not delete the section.');
    } finally {
      setState({ isDeleting: false });
    }
  };

  const deleteQuestion = async () => {
    const question = state.questionToDelete;
    if (!question) return;
    try {
      setState({ isDeleting: true });
      await QuestionService.upsertQuestion({ ...question, _deleted: true });
      removeQuestionById(question._id);
      successToast({ message: 'Question deleted successfully.' });
      setState({ questionToDelete: null });
      // The server recalculated the section and paper totals as part of the delete, so the paper is
      // re-read — last, because a failed refresh is not a failed delete.
      await reloadTestPaper(testPaperId);
    } catch (error) {
      reportError(error, 'Could not delete the question.');
    } finally {
      setState({ isDeleting: false });
    }
  };

  /**
   * `isForce` is how the footer closes the drawer after a successful save: at that moment the
   * save's own loading flag is still set, and without it the guard below would keep the drawer
   * open on top of the question it has just added.
   */
  const onCloseAddQuestionModal = (isForce = false) => {
    // Read the draft at call time: the footer patches `isNew` to false and closes in the same tick,
    // so a flag captured during render still says "draft" and drops the question it has just saved.
    const questionId = useSelectorStore.getState().selectedQuestionId;
    if ((state.isLoading && !isForce) || !selectedTestPaperSection || !questionId) return;
    // Options are embedded, so dropping the question drops them with it.
    if (useQuestionStore.getState().getQuestionById(questionId)?.isNew) removeQuestionById(questionId);
    removeSelectedQuestionId();
    setState({ isOpenUpsertQuestion: false });
  };

  const onCloseAddSectionModal = () => {
    if (state.isLoading) return;
    // The form patches the store as the author types, so Cancel has to undo: a draft that was
    // never saved is dropped (or "Section 3" would count up on every cancelled attempt), and a
    // saved section is put back as it was when the drawer opened.
    if (editingSection?.isNew) removeTestPaperSection(editingSection._id);
    else if (state.sectionBackup) patchTestPaperSection(state.sectionBackup._id, state.sectionBackup);
    setState({ isOpenAddSection: false, sectionId: null, sectionBackup: null });
  };

  const getSectionMenuItems = (section: ITestPaperSection): IMenuItem[] => [
    {
      label: 'Edit Section',
      onClick: () => editSection(section),
      icon: <PencilIcon weight="bold" className="w-4 h-4" />,
    },
    {
      label: 'Add New Section',
      onClick: () => addNewSection(),
      icon: <PlusIcon weight="bold" className="w-4 h-4" />,
    },
    {
      // Was `onClick: () => {}` — the item deleted nothing.
      label: 'Delete Section',
      onClick: () => requestDeleteSection(section),
      icon: <TrashIcon weight="bold" className="w-4 h-4" />,
    },
  ];

  useEffect(() => {
    if (!testPaperId) push('/test-papers');
    else {
      setSelectedTestPaperId(testPaperId);
      loadTestPaperSectionsWithQuestions(testPaperId);
      if (useStandardStore.getState().shouldLoad('orgChapters')) loadOrgChapters();
    }
  }, [testPaperId]);

  useEffect(() => {
    // `shouldLoad` rather than `!isLoaded`: the old guard re-fired the fetch on every mount while
    // one was already in flight, and never retried after a failure.
    if (useTestPaperStore.getState().shouldLoad('testPapers')) loadTestPapers();
  }, []);

  const isPaperLoading = isLoadingTestPapers && !selectedTestPaper;
  const isPaperFailed = testPaperStore.isFailed('testPapers') && !selectedTestPaper;
  const isSectionsFailed = testPaperStore.isFailed('testPaperSections');

  if (isPaperLoading) return <TestPaperSkeleton />;

  if (!selectedTestPaper) {
    return (
      <PaperMissing
        error={isPaperFailed ? (testPaperStore.getError('testPapers') ?? 'Something went wrong.') : undefined}
        onRetry={() => loadTestPapers()}
        onBack={() => push('/test-papers')}
      />
    );
  }

  const renderSections = () => {
    if (hasSections) {
      return sections.map((section) => (
        <SectionCard
          key={section._id}
          section={section}
          onAddQuestion={() => onOpenAddQuestionModal(section._id)}
          onGenerateQuestions={() => onOpenAi(section._id)}
          sectionMenuItems={getSectionMenuItems(section)}
          onEditQuestion={(question) => editQuestion(question._id, section._id)}
          onDeleteQuestion={(question) => setState({ questionToDelete: question })}
        />
      ));
    }
    if (isLoadingSections) return <TestPaperSkeleton withHeader={false} />;
    if (isSectionsFailed) {
      return (
        <BlankState
          label="Could not load the questions"
          description={testPaperStore.getError('testPaperSections')}
          className="py-12"
          action={<Button text="Retry" onClick={() => loadTestPaperSectionsWithQuestions(testPaperId)} />}
        />
      );
    }
    return (
      <BlankState
        label="No sections yet"
        description="A paper is organised in sections — Physics, Chemistry, or Section A and B. Add the first one to start writing questions."
        className="py-12"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              text="Add section"
              leftsection={<PlusIcon weight="bold" className="w-4 h-4" />}
              onClick={addNewSection}
            />
            <Button
              isSecondary
              text="Generate with AI"
              leftsection={<SparkleIcon weight="bold" className="w-4 h-4" />}
              onClick={() => onOpenAi(null)}
            />
          </div>
        }
      />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="px-5 py-5 border rounded-lg">
        <TestPaperDetails
          testPaper={selectedTestPaper}
          sectionCount={countSections(selectedTestPaper, sections.length, isLoadingSections)}
          addNewSection={addNewSection}
          onEditPaper={() => setState({ isOpenEditPaper: true })}
          onGenerate={() => onOpenAi(null)}
        />
      </Card>
      {renderSections()}
      <Modal
        position={PositionType.RIGHT}
        className="min-w-full md:min-w-[60%] lg:min-w-[60%] md:max-w-[60%] lg:max-w-[60%]"
        title={getUpsertTitle(isNewQuestion, 'Question')}
        description="Two steps: write the question and its options, then mark the answer and add a solution."
        isOpen={state.isOpenUpsertQuestion}
        onClose={() => onCloseAddQuestionModal()}
        component={<QuestionSteps />}
        footer={
          <UpsertQuestionFooter onClose={onCloseAddQuestionModal} setLoading={setLoading} isLoading={state.isLoading} />
        }
      />
      <SectionDrawer
        section={editingSection}
        isOpen={state.isOpenAddSection}
        isLoading={state.isLoading}
        onClose={onCloseAddSectionModal}
        onSave={saveSection}
      />
      <AiTestPaperDrawer
        isOpen={state.isOpenAi}
        onClose={() => setState({ isOpenAi: false })}
        testPaper={selectedTestPaper}
        sections={sections}
        initialSectionId={state.aiSectionId ?? undefined}
      />
      {/* Mounted only while open, so its auto-name effect cannot reach the selected paper otherwise. */}
      {state.isOpenEditPaper && <CreateTestPaperModal isOpen onClose={() => setState({ isOpenEditPaper: false })} />}
      <SoftConfirmModal
        title="Delete Section"
        description={
          <div>
            Delete <strong>{state.sectionToDelete?.name}</strong>? It is removed from this paper and from anything else
            referencing it.
          </div>
        }
        isOpen={!!state.sectionToDelete}
        isLoading={state.isDeleting}
        isDestructive
        confirmText="Delete"
        onCancel={() => !state.isDeleting && setState({ sectionToDelete: null })}
        onConfirm={deleteSection}
      />
      <SoftConfirmModal
        title="Delete Question"
        description="Delete this question? Its options and solution go with it, and the paper's totals are recalculated."
        isOpen={!!state.questionToDelete}
        isLoading={state.isDeleting}
        isDestructive
        confirmText="Delete"
        onCancel={() => !state.isDeleting && setState({ questionToDelete: null })}
        onConfirm={deleteQuestion}
      />
    </div>
  );
};
