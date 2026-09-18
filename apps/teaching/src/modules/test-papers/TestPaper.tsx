import { defaultMarkings } from '@utils/constants';
import { type QuestionDto } from '@repo/shared/contracts';
import {
  Accordions,
  Button,
  Card,
  Loader,
  Menu,
  Modal,
  ModalFooter,
  SoftConfirmModal,
  SplitButton,
} from '@repo/ui/app';
import { PencilIcon, PlusIcon, TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { BlankState } from '@components/others';
import { PositionType, SectionCategoryType, SectionType } from '@enums';
import { type IMenuItem } from '@interfaces';
import { QuestionService, TestPaperService } from '@services';
import {
  type ITestPaperSection,
  useStandardLookups,
  useQuestionLookups,
  useSelectedQuestion,
  useSelectedTestPaper,
  useSelectedTestPaperSection,
  useSelectorLookups,
  useTestPaperLookups,
  useTestPaperStore,
} from '@stores';
import { errorToast, reportError, splitCamelCase, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { ChapterName } from '@components/common/ChapterName';
import {
  CreateTestPaperModal,
  GenerateQuestionsModal,
  Options,
  Question,
  Solution,
  TestPaperDetails,
  UpsertQuestionFooter,
  UpsertQuestionStepper,
  UpsertTestPaperSection,
} from './components';

interface IProps {
  testPaperId: string;
}

interface IState {
  isOpenUpsertQuestion: boolean;
  isOpenGenerateQuestions: boolean;
  isOpenEditPaper: boolean;
  isLoading: boolean;
  section: ITestPaperSection | null;
  isOpenAddSection: boolean;
  /** The section the delete confirm is asking about, or `null` while it is closed. */
  sectionToDelete: ITestPaperSection | null;
  questionToDelete: QuestionDto | null;
  isDeleting: boolean;
}

/** The title an upsert modal shows, which depends only on whether the row is still a draft. */
const getUpsertTitle = (isNew: boolean | undefined, noun: string) => `${isNew ? 'Create New' : 'Update'} ${noun}`;

export const TestPaper = ({ testPaperId }: IProps) => {
  const testPaperStore = useTestPaperLookups();
  const { getSectionQuestions, patchTestPaperSection, removeTestPaperSection, reloadTestPaper } = testPaperStore;
  const { patchTestPaper } = testPaperStore;
  const selectorStore = useSelectorLookups();
  const questionStore = useQuestionLookups();
  const {
    setSelectedTestPaperSectionId,
    selectedQuestionType,
    setSelectedUpsertQuestionStep,
    removeSelectedQuestionId,
    setSelectedQuestionId,
    setSelectedTestPaperId,
  } = selectorStore;
  const selectedTestPaperSection = useSelectedTestPaperSection();
  const selectedTestPaper = useSelectedTestPaper();
  const selectedQuestion = useSelectedQuestion();
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
  const { createQuestion, removeQuestionById } = questionStore;
  const { push } = useRouter();
  const [state, setState] = useSetState<IState>({
    isOpenUpsertQuestion: false,
    isOpenGenerateQuestions: false,
    isOpenEditPaper: false,
    isLoading: false,
    section: null,
    isOpenAddSection: false,
    sectionToDelete: null,
    questionToDelete: null,
    isDeleting: false,
  });
  const sections = selectedTestPaper ? getTestPaperSectionsByIds(selectedTestPaper.sections ?? []) : [];
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

  const onOpenGenerateQuestionsModal = (sectionId: string) => {
    setSelectedTestPaperSectionId(sectionId);
    setState({ isOpenGenerateQuestions: true });
  };

  const onCloseGenerateQuestionsModal = () => {
    setState({ isOpenGenerateQuestions: false });
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
    setState({ section: newSection, isOpenAddSection: true });
  };

  const editSection = (section: ITestPaperSection) => {
    setState({ section, isOpenAddSection: true });
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
    if (!state.section || !selectedTestPaper) return;
    if (!state.section.name?.trim()) {
      errorToast({ message: 'Section name is required.' });
      return;
    }
    try {
      setState({ isLoading: true });
      const sectionIds = [...new Set([...(selectedTestPaper.sections ?? []), state.section._id])];
      if (state.section.isNew) patchTestPaper(selectedTestPaper._id, { sections: sectionIds });
      // Re-read for the same reason as `CreateTestPaperModal`: `patchTestPaper` has just added the
      // section id, and `selectedTestPaper` is the copy from before that patch.
      const paperToSave = useTestPaperStore.getState().getTestPaperById(selectedTestPaper._id) ?? selectedTestPaper;
      await Promise.all([
        state.section.isNew ? TestPaperService.upsertTestPaper(paperToSave) : Promise.resolve(),
        TestPaperService.upsertTestPaperSection(state.section),
      ]);
      patchTestPaperSection(state.section._id, { isNew: false });
      setState({ isOpenAddSection: false, section: null });
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

  const onCloseAddQuestionModal = () => {
    if (state.isLoading || !selectedTestPaperSection || !selectedQuestion) return;
    // Options are embedded, so dropping the question drops them with it.
    if (selectedQuestion.isNew) removeQuestionById(selectedQuestion._id);
    removeSelectedQuestionId();
    setState({ isOpenUpsertQuestion: false });
  };

  const onCloseAddSectionModal = () => {
    if (state.isLoading) return;
    setState({ isOpenAddSection: false });
  };

  const getAddQuestionItems = (sectionId: string): IMenuItem[] => [
    {
      label: 'Add Question',
      onClick: () => onOpenAddQuestionModal(sectionId),
      icon: <PlusIcon weight="bold" className="w-4 h-4" />,
    },
    {
      label: 'Generate Questions',
      onClick: () => onOpenGenerateQuestionsModal(sectionId),
      icon: <UploadSimpleIcon weight="bold" className="w-4 h-4" />,
    },
  ];

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

  const renderQuestion = (question: QuestionDto, sectionId: string) => (
    <div className="w-full">
      <div className="flex justify-between items-center">
        <div className="text-xs font-semibold capitalize">{splitCamelCase(question.questionType)}</div>
        <div className="-mr-3">
          <Menu
            menuItems={[
              {
                label: 'Edit Question',
                onClick: () => editQuestion(question._id, sectionId),
                icon: <PencilIcon weight="bold" className="w-4 h-4" />,
              },
              {
                label: 'Delete Question',
                onClick: () => setState({ questionToDelete: question }),
                icon: <TrashIcon weight="bold" className="w-4 h-4" />,
              },
            ]}
            className=""
          />
        </div>
      </div>
      <div>
        <Options question={question} />
      </div>
      <div className="py-2">
        <Solution question={question} prefix={`Solution:`} />
        <ChapterName chapterId={question.chapter} />
      </div>
    </div>
  );

  const renderSection = (section: ITestPaperSection) => {
    const questions = getSectionQuestions(section._id);
    return (
      <div className="min-h-[100px]">
        {/* The section's menu lives here rather than in the accordion title, which is a `<button>`:
            a menu trigger nested inside it was a button inside a button. */}
        <div className="flex justify-end items-center gap-2">
          <SplitButton
            menuItems={getAddQuestionItems(section._id)}
            text="Add Question"
            onClick={() => onOpenAddQuestionModal(section._id)}
          />
          <Menu menuItems={getSectionMenuItems(section)} className="" />
        </div>
        <div className="py-3">
          {questions.length ? (
            <Accordions
              isIconLast={true}
              key={section._id}
              items={questions.map((question, index) => ({
                title: <Question question={question} prefix={`Q${index + 1}.`} marks={question.markings} />,
                component: renderQuestion(question, section._id),
              }))}
            />
          ) : (
            <BlankState
              label="No questions yet"
              description="Add one question at a time, or generate a batch from a document."
            />
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!testPaperId) push('/test-papers');
    else {
      setSelectedTestPaperId(testPaperId);
      loadTestPaperSectionsWithQuestions(testPaperId);
      loadOrgChapters();
    }
  }, [testPaperId]);

  useEffect(() => {
    // `shouldLoad` rather than `!isLoaded`: the old guard re-fired the fetch on every mount while
    // one was already in flight, and never retried after a failure.
    if (useTestPaperStore.getState().shouldLoad('testPapers')) loadTestPapers();
  }, []);

  if (!selectedTestPaper) return null;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <TestPaperDetails
          testPaper={selectedTestPaper}
          addNewSection={addNewSection}
          onEditPaper={() => setState({ isOpenEditPaper: true })}
        />
      </Card>
      {hasSections && (
        <Accordions
          openIndexes={[0]}
          items={sections.map((section) => ({
            // Text only: everything interactive moved into the panel below.
            title: (
              <div className="text-sm font-bold text-foreground">
                {section.name}{' '}
                <span className="font-normal text-muted-foreground">
                  ({getSectionQuestions(section._id).length}{' '}
                  {getSectionQuestions(section._id).length === 1 ? 'question' : 'questions'})
                </span>
              </div>
            ),
            component: renderSection(section),
          }))}
        />
      )}
      {!hasSections && isLoadingSections && <Loader isLoading={isLoadingSections} />}
      {!hasSections && !isLoadingSections && (
        <BlankState
          label="No sections found"
          description="A paper needs at least one section before questions can be added."
          action={
            <Button
              text="Add Section"
              leftsection={<PlusIcon weight="bold" className="w-4 h-4" />}
              onClick={addNewSection}
            />
          }
        />
      )}
      <Modal
        position={PositionType.RIGHT}
        className="min-w-full md:min-w-[60%] lg:min-w-[60%] md:max-w-[60%] lg:max-w-[60%]"
        title={getUpsertTitle(selectedQuestion?.isNew, 'Question')}
        isOpen={state.isOpenUpsertQuestion}
        onClose={onCloseAddQuestionModal}
        component={<UpsertQuestionStepper />}
        footer={
          <UpsertQuestionFooter onClose={onCloseAddQuestionModal} setLoading={setLoading} isLoading={state.isLoading} />
        }
      />
      <Modal
        title={getUpsertTitle(state.section?.isNew, 'Section')}
        isOpen={state.isOpenAddSection}
        onClose={onCloseAddSectionModal}
        component={state.section && <UpsertTestPaperSection section={state.section} isLoading={state.isLoading} />}
        footer={<ModalFooter onCancel={onCloseAddSectionModal} onSave={saveSection} isLoading={state.isLoading} />}
      />
      <GenerateQuestionsModal isOpen={state.isOpenGenerateQuestions} onClose={onCloseGenerateQuestionsModal} />
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
