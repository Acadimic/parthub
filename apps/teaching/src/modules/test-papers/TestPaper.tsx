import { type QuestionDto } from '@repo/shared/contracts';
import { Accordions, Card, Loader, Menu, Modal, ModalFooter, SplitButton, Tooltip } from '@repo/ui/app';
import { PencilIcon, PlusIcon, TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { BlankState } from '@components/others';
import { PositionType, SectionCategoryType, SectionType } from '@enums';
import { TestPaperService } from '@services';
import {
  type ITestPaperSection,
  useStandardLookups,
  useQuestionLookups,
  useSelectedQuestion,
  useSelectedTestPaper,
  useSelectedTestPaperSection,
  useSelectorLookups,
  useTestPaperLookups,
} from '@stores';
import { splitCamelCase } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { ChapterName } from '@components/common/ChapterName';
import {
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
  isLoading: boolean;
  question: QuestionDto | null;
  section: ITestPaperSection | null;
  isOpenAddSection: boolean;
}

/** The title an upsert modal shows, which depends only on whether the row is still a draft. */
const getUpsertTitle = (isNew: boolean | undefined, noun: string) => `${isNew ? 'Create New' : 'Update'} ${noun}`;

export const TestPaper = ({ testPaperId }: IProps) => {
  const testPaperStore = useTestPaperLookups();
  const { getSectionQuestions, patchTestPaperSection } = testPaperStore;
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
    setSelectedSolutionId,
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
  const isLoadedTestPapers = testPaperStore.isLoaded('testPapers');
  const isLoadingTestPaperSections = testPaperStore.isLoading('testPaperSections');
  const { loadOrgChapters } = useStandardLookups();
  const { getOptionsByIds, createQuestion, removeOptionById, removeQuestionById, getSolutionByQuestionId } =
    questionStore;
  const { push } = useRouter();
  const [state, setState] = useSetState<IState>({
    isOpenUpsertQuestion: false,
    isOpenGenerateQuestions: false,
    isLoading: false,
    question: null,
    section: null,
    isOpenAddSection: false,
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
    createQuestion({
      standard: (selectedTestPaper.standards ?? [])[0],
      questionType: selectedQuestionType,
      section: sectionId,
      markings: section.defaultMarkings[selectedQuestionType],
    });
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
    const section = selectedTestPaperSection ?? sections[0];
    if (!section) return;
    const newSection = createTestPaperSection(SectionType.SECTION, SectionCategoryType.CUSTOM, section.defaultMarkings);
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
    setSelectedSolutionId(getSolutionByQuestionId(questionId)?._id || '');
    setState({ isOpenUpsertQuestion: true });
  };

  const saveSection = async () => {
    if (!state.section || !selectedTestPaper) return;
    try {
      setState({ isLoading: true });
      const sectionIds = [...new Set([...(selectedTestPaper.sections ?? []), state.section._id])];
      if (state.section.isNew) patchTestPaper(selectedTestPaper._id, { sections: sectionIds });
      await Promise.all([
        state.section.isNew ? TestPaperService.upsertTestPaper(selectedTestPaper) : Promise.resolve(),
        TestPaperService.upsertTestPaperSection(state.section),
      ]);
      patchTestPaperSection(state.section._id, { isNew: false });
      setState({ isOpenAddSection: false, section: null });
    } catch {
    } finally {
      setState({ isLoading: false });
    }
  };

  const onCloseAddQuestionModal = () => {
    if (state.isLoading || !selectedTestPaperSection || !selectedQuestion) return;
    getOptionsByIds(selectedQuestion.options ?? []).forEach((option) => option.isNew && removeOptionById(option._id));
    if (selectedQuestion.isNew) removeQuestionById(selectedQuestion._id);
    removeSelectedQuestionId();
    setState({ isOpenUpsertQuestion: false });
  };

  const onCloseAddSectionModal = () => {
    if (state.isLoading) return;
    setState({ isOpenAddSection: false });
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
    if (!isLoadedTestPapers) loadTestPapers();
  }, []);

  if (!selectedTestPaper) return null;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <TestPaperDetails testPaper={selectedTestPaper} addNewSection={addNewSection} />
      </Card>
      {hasSections && (
        <Accordions
          openIndexes={[0]}
          items={sections.map((section) => ({
            title: (
              <div className="flex justify-between w-full items-center relative">
                <div className="text-sm font-bold text-info">
                  {section.name}{' '}
                  <Tooltip
                    title={`${getSectionQuestions(section._id).length} Question${getSectionQuestions(section._id).length > 1 ? 's' : ''}`}
                  >
                    <span>({getSectionQuestions(section._id).length})</span>
                  </Tooltip>
                </div>
                <div className="absolute -right-4">
                  <Menu
                    menuItems={[
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
                        label: 'Delete Section',
                        onClick: () => {},
                        icon: <TrashIcon weight="bold" className="w-4 h-4" />,
                      },
                    ]}
                    className=""
                  />
                </div>
              </div>
            ),
            component: (
              <div className="min-h-[100px]">
                <div className="flex justify-end">
                  <div>
                    {getSectionQuestions(section._id).length ? (
                      <SplitButton
                        menuItems={[
                          {
                            label: 'Add Question',
                            onClick: () => onOpenAddQuestionModal(section._id),
                            icon: <PlusIcon weight="bold" className="w-4 h-4" />,
                          },
                          {
                            label: 'Generate Questions',
                            onClick: () => onOpenGenerateQuestionsModal(section._id),
                            icon: <UploadSimpleIcon weight="bold" className="w-4 h-4" />,
                          },
                        ]}
                        text="Add Question"
                        onClick={() => onOpenAddQuestionModal(section._id)}
                      />
                    ) : null}
                  </div>
                </div>
                <div className="py-3">
                  {getSectionQuestions(section._id).length ? (
                    <Accordions
                      isIconLast={true}
                      key={section._id}
                      items={getSectionQuestions(section._id).map((question, index) => {
                        return {
                          title: <Question question={question} prefix={`Q${index + 1}.`} marks={question.markings} />,
                          component: (
                            <div className="w-full">
                              <div className="flex justify-between items-center">
                                <div className="text-xs font-semibold capitalize">
                                  {splitCamelCase(question.questionType)}
                                </div>
                                <div className="-mr-3">
                                  <Menu
                                    menuItems={[
                                      {
                                        label: 'Edit Question',
                                        onClick: () => editQuestion(question._id, section._id),
                                        icon: <PencilIcon weight="bold" className="w-4 h-4" />,
                                      },
                                      {
                                        label: 'Delete Question',
                                        onClick: () => {},
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
                          ),
                        };
                      })}
                    />
                  ) : (
                    <div className="flex flex-col justify-center items-center gap-3 min-h-[100px]">
                      <BlankState label="No questions found" />
                      <SplitButton
                        menuItems={[
                          {
                            label: 'Add Question',
                            onClick: () => onOpenAddQuestionModal(section._id),
                            icon: <PlusIcon weight="bold" className="w-4 h-4" />,
                          },
                          {
                            label: 'Generate Questions',
                            onClick: () => onOpenGenerateQuestionsModal(section._id),
                            icon: <UploadSimpleIcon weight="bold" className="w-4 h-4" />,
                          },
                        ]}
                        text="Add Question"
                        onClick={() => onOpenAddQuestionModal(section._id)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ),
          }))}
        />
      )}
      {!hasSections && isLoadingSections && <Loader isLoading={isLoadingSections} />}
      {!hasSections && !isLoadingSections && <BlankState label="No sections found" />}
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
    </div>
  );
};
