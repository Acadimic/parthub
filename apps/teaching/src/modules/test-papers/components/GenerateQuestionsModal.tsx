import { Select } from '@components/app/selects';
import { Label, Modal, ModalFooter, TextArea, TextInput } from '@repo/ui/app';
import { ArticleIcon, EqualizerIcon } from '@phosphor-icons/react';
import { LevelType, PositionType, QuestionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { TestPaperService } from '@services';
import {
  useQuestionLookups,
  useSelectedTestPaper,
  useSelectedTestPaperSection,
  useSelectorLookups,
  useTestPaperLookups,
} from '@stores';
import { getGeneratedQuestionsPrompt } from '@utils/ai/prompts';
import { errorToast, splitCamelCase, successToast } from '@utils/helpers';
import { useSetState } from 'react-use';
import { CopyUrl } from '@components/common';
import { getTextAndEquationBlocksString } from '@components/editors/math-jax-editor/util';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IState {
  totalQuestions: number;
  questionsText: string;
  isLoading: boolean;
  selectedQuestionType: QuestionType;
  selectedLevels: LevelType[];
  prompt: string;
}

interface IQuestionObject {
  questionText: string;
  options: { optionText: string; isCorrect: boolean }[];
  standard: string;
  subject: string;
  solutionText?: string;
}

export const GenerateQuestionsModal = ({ isOpen, onClose }: IProps) => {
  const selectorStore = useSelectorLookups();
  const testPaperStore = useTestPaperLookups();
  const { updateTotalQuestionsAndMarks } = testPaperStore;
  const { getTestPaperSubjectItems } = testPaperStore;
  const { getTestPaperStandardItems } = testPaperStore;
  const questionStore = useQuestionLookups();
  const { patchQuestion } = questionStore;
  const { patchOption, patchSolution } = questionStore;
  const { removeSelectedQuestionId } = selectorStore;
  const selectedTestPaperSection = useSelectedTestPaperSection();
  const selectedTestPaper = useSelectedTestPaper();
  const {
    createQuestion,
    getOptionsByIds,
    upsertSolution,
    getSolutionByQuestionId,
    getNewQuestions,
    getNewOptions,
    getNewSolutions,
    removeQuestionById,
    removeOptionById,
    removeSolutionById,
  } = questionStore;
  const [state, setState] = useSetState<IState>({
    totalQuestions: 20,
    questionsText: '',
    isLoading: false,
    selectedQuestionType: QuestionType.SINGLE_CHOICE,
    selectedLevels: Object.values(LevelType),
    prompt: '',
  });

  const handleClose = () => {
    if (state.isLoading) return;
    onClose();
  };

  const onChangeQuestionType = (values: ISelectItem[]) => {
    setState({ selectedQuestionType: values[0]?.value as QuestionType });
  };

  const onChangeLevels = (values: ISelectItem[]) => {
    setState({ selectedLevels: values.map((item) => item.value as LevelType) });
  };

  const generateAndSaveQuestions = async () => {
    if (!selectedTestPaperSection || !selectedTestPaper) return;
    setState({ isLoading: true });
    try {
      const questionText = state.questionsText.replace(/\\/g, '\\\\').trim();
      let questionObjects: IQuestionObject[] = JSON.parse(questionText);
      questionObjects = questionObjects.filter(
        (v, i, a) =>
          a.findIndex(
            (v2) =>
              JSON.stringify({ questionText: v.questionText, options: v.options }) ===
              JSON.stringify({ questionText: v2.questionText, options: v2.options }),
          ) === i,
      ); // remove duplicate questions
      const questions = questionObjects.map((questionObject) => {
        const questionType =
          questionObject.options.filter((opt) => opt.isCorrect).length > 1
            ? QuestionType.MULTIPLE_CHOICE
            : state.selectedQuestionType;
        const question = createQuestion({
          standard:
            getTestPaperStandardItems(selectedTestPaper._id).find((item) => item.label === questionObject.standard)
              ?.value || (selectedTestPaper.standards ?? [])[0],
          subject:
            getTestPaperSubjectItems(selectedTestPaper._id).find((item) => item.label === questionObject.subject)
              ?.value || (selectedTestPaper.subjects ?? [])[0],
          questionType,
          section: selectedTestPaperSection._id,
          markings: selectedTestPaperSection.defaultMarkings[questionType],
        });
        patchQuestion(question._id, { question: getTextAndEquationBlocksString(questionObject.questionText) });
        getOptionsByIds(question.options ?? []).forEach((option, index) => {
          patchOption(option._id, { option: getTextAndEquationBlocksString(questionObject.options[index].optionText) });
          patchOption(option._id, { isCorrect: questionObject.options[index].isCorrect || false });
        });
        upsertSolution(question._id, getTextAndEquationBlocksString(questionObject.solutionText || ''));
        return question;
      });
      await TestPaperService.upsertBulkTestPaperSectionQuestions({
        testPaper: selectedTestPaper._id,
        questions: questions.map((question) => {
          const options = getOptionsByIds(question.options ?? []);
          const solution = getSolutionByQuestionId(question._id);
          return {
            question,
            options,
            solution: solution?.solution ? solution : undefined,
          };
        }),
      });
      successToast({ message: `${questions.length} questions generated successfully!` });
      setTimeout(() => {
        questions.forEach((question) => {
          patchQuestion(question._id, { isNew: false });
          getOptionsByIds(question.options ?? []).forEach((option) => patchOption(option._id, { isNew: false }));
          const solution = getSolutionByQuestionId(question._id);
          if (solution) patchSolution(solution._id, { isNew: false });
        });
        updateTotalQuestionsAndMarks(selectedTestPaper._id);
        onClose();
      }, 500);
    } catch (error) {
      console.error(error);
      errorToast({ message: 'Invalid questions text.' });
      getNewOptions().forEach((option) => removeOptionById(option._id));
      getNewSolutions().forEach((solution) => removeSolutionById(solution._id));
      getNewQuestions().forEach((question) => removeQuestionById(question._id));
    } finally {
      setState({ isLoading: false });
      removeSelectedQuestionId();
    }
  };

  const questionPrompt = getGeneratedQuestionsPrompt({
    numberOfQuestions: state.totalQuestions,
    questionType: state.selectedQuestionType,
    standardNames: selectedTestPaper
      ? getTestPaperStandardItems(selectedTestPaper._id).map((item) => item.label as string)
      : [],
    subjectNames: selectedTestPaper
      ? getTestPaperSubjectItems(selectedTestPaper._id).map((item) => item.label as string)
      : [],
    levels: state.selectedLevels,
    prompt: state.prompt,
  });

  return (
    <Modal
      position={PositionType.RIGHT}
      className="min-w-full md:min-w-[60%] lg:min-w-[60%] md:max-w-[60%] lg:max-w-[60%]"
      title={`Generate Questions`}
      isOpen={isOpen}
      onClose={handleClose}
      component={
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <div className="w-[50%]">
              <TextInput
                type="number"
                value={state.totalQuestions}
                onChange={(e) => setState({ totalQuestions: Number(e.target.value) })}
                label="Total Questions"
                required
              />
            </div>
            <div className="w-[50%]">
              <Label label="Question Type" required />
              <Select
                onChange={onChangeQuestionType}
                items={Object.values(QuestionType).map((type) => ({ label: splitCamelCase(type), value: type }))}
                isSingleSelect
                values={[state.selectedQuestionType]}
                leftsection={<ArticleIcon weight="bold" className="w-5 h-5" />}
                placeholder="Select question type"
              />
            </div>
          </div>
          <div>
            <Select
              onChange={onChangeLevels}
              items={Object.values(LevelType).map((type) => ({ label: splitCamelCase(type), value: type }))}
              values={state.selectedLevels}
              leftsection={<EqualizerIcon weight="bold" className="w-5 h-5" />}
              placeholder="Select question levels"
            />
          </div>
          <div className="w-[50%]">
            <TextInput
              type="text"
              value={state.prompt}
              onChange={(e) => setState({ prompt: e.target.value })}
              label="Additional Prompt"
              required
            />
          </div>
          <div>
            <Label label="Question Prompt" required />
            <div className="flex items-start justify-between gap-2">
              <div className="line-clamp-6 text-color-secondary text-sm">{questionPrompt}</div>
              <div className="py-2">
                <CopyUrl url={questionPrompt} isCopyIconOnly />
              </div>
            </div>
          </div>
          <TextArea
            value={state.questionsText}
            onChange={(e) => setState({ questionsText: e.target.value })}
            label="Questions"
          />
        </div>
      }
      footer={<ModalFooter onCancel={handleClose} onSave={generateAndSaveQuestions} isLoading={state.isLoading} />}
    />
  );
};
