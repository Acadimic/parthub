import { RichTextView } from '@repo/ui/content';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { type MarkingType } from '@repo/shared/interfaces';
import { Bookmark } from '@components/common';
import { CollectionType, Marking, QuestionType } from '@enums';
import { CaretDownIcon, ClockIcon } from '@phosphor-icons/react';
import { useQuestionLookups, useSelectedQuestion, useTestPaperLookups } from '@stores';
import { splitCamelCase } from '@utils/helpers';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Answer } from './components/answer-items';
import { TestPaperSection } from './components/exam-items';
import { Options } from './components/question-items';

// Lazy so recharts loads when a result is shown, not when the exam opens.
const Result = dynamic(() => import('./components/result').then((m) => m.Result));

interface IProps {
  isResultPage: boolean;
  openExamSummary: () => void;
  toggleTimer: () => void;
  openInstruction: () => void;
  /** Leaves the result page for the paper, open at the given question. */
  onReviewQuestion: (questionId: string) => void;
}

/**
 * The marks beside a question: what is on offer before it is answered, and what it actually
 * scored once it is marked.
 */
const QuestionScore = ({
  isCompleted,
  marks,
  markings,
}: {
  isCompleted: boolean;
  marks: number;
  markings: MarkingType;
}) => {
  if (!isCompleted) {
    return (
      <>
        <Badge tone="success">+{markings[Marking.CORRECT]}</Badge>
        <Badge tone="destructive">{markings[Marking.INCORRECT]}</Badge>
      </>
    );
  }
  return (
    <Badge tone={marks > 0 ? 'success' : 'destructive'} appearance="solid">
      {marks > 0 ? '+' : ''}
      {marks}
    </Badge>
  );
};

export const Exam = ({ isResultPage, openExamSummary, toggleTimer, openInstruction, onReviewQuestion }: IProps) => {
  const testPaperStore = useTestPaperLookups();
  const { getTestPaperSectionsByIds } = testPaperStore;
  const questionStore = useQuestionLookups();
  const { getCorrectOptionIndexes } = questionStore;
  const { exam } = testPaperStore;
  const selectedQuestion = useSelectedQuestion();
  const { getSolutionByQuestionId, getQuestionOptions } = questionStore;
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (!exam) return;
    if (exam.isPractice) toggleTimer();
    else openInstruction();
  }, []);

  if (!exam) return <></>;

  if (!selectedQuestion) return <></>;

  const { numberOfQuestions } = exam;
  // Was the `sectionObjects` view on the model; the sections live in the store that owns them.
  const sectionObjects = getTestPaperSectionsByIds(exam.sections);

  const {
    getAnswersByQuestionId,
    getCurrentQuestionIndex,
    getResponsesByQuestionId,
    getResultByQuestionId,
    getSelectedQuestionReplyTime,
    isSelectedQuestionCompleted,
    setResponse,
  } = testPaperStore;

  const handleResponses = (responses: string[]) => {
    setResponse(responses);
    setRefresh(!refresh);
  };

  // `partiallyCorrect` is optional on `MarkingType`, so a paper that does not define it scores 0.
  const marks = selectedQuestion.markings[getResultByQuestionId(selectedQuestion._id)] ?? 0;
  const isCompleted = isSelectedQuestionCompleted();
  const isTypedAnswer =
    !selectedQuestion.questionType ||
    ![QuestionType.BOOLEAN, QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE].includes(
      selectedQuestion.questionType,
    );

  if (isResultPage) return <Result onReviewQuestion={onReviewQuestion} />;

  return (
    <div className="flex h-full flex-col gap-3 py-3 md:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <span className="hidden text-muted-foreground md:inline">Sections</span>
          {sectionObjects.map((section) => (
            <TestPaperSection section={section} key={section._id} />
          ))}
        </div>
        {/* Below `xl` the palette is a sheet; this is what opens it. */}
        <button
          type="button"
          onClick={openExamSummary}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 font-mono text-sm font-semibold hover:bg-accent xl:hidden"
        >
          <span>
            {getCurrentQuestionIndex() + 1}
            <span className="text-muted-foreground"> / {numberOfQuestions}</span>
          </span>
          <CaretDownIcon weight="bold" className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-base font-semibold">
              Question {getCurrentQuestionIndex() + 1}
              <span className="font-normal text-muted-foreground"> of {numberOfQuestions}</span>
            </span>
            <Badge tone="neutral" appearance="outline" className="capitalize">
              {splitCamelCase(selectedQuestion.questionType)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {getSelectedQuestionReplyTime() ? (
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <ClockIcon weight="bold" className="h-3.5 w-3.5" />
                {getSelectedQuestionReplyTime()}
              </span>
            ) : null}
            <QuestionScore isCompleted={isCompleted} marks={marks} markings={selectedQuestion.markings} />
            <Bookmark collectionItem={selectedQuestion._id} collectionRef={CollectionType.QUESTION} />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 md:px-6 md:py-5">
          <div className="text-base leading-relaxed">
            <RichTextView value={selectedQuestion.body} />
          </div>
          <div className="mt-5">
            <Options
              question={selectedQuestion}
              selectedValues={getResponsesByQuestionId(selectedQuestion._id)}
              handleResponses={handleResponses}
              isDisabled={isCompleted}
              answers={isCompleted ? getAnswersByQuestionId(selectedQuestion._id) : []}
            />
          </div>
          <div className={cn('mt-6 transition-opacity duration-500', isCompleted ? 'opacity-100' : 'opacity-0')}>
            {isCompleted ? (
              <Answer
                correctOptionIndexes={getCorrectOptionIndexes(selectedQuestion._id)}
                solution={getSolutionByQuestionId(selectedQuestion._id)}
                answers={getQuestionOptions(selectedQuestion._id)
                  .filter((option) => getAnswersByQuestionId(selectedQuestion._id).includes(option._id))
                  .map((option) => option.body)}
                isAnswer={isTypedAnswer}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
