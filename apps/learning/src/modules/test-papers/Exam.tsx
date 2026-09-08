import { Bookmark } from '@components/common';
import { Html } from '@components/others';
import { CollectionType, Marking, QuestionType } from '@enums';
import { CaretDownIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { splitCamelCase } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Answer } from './components/answer-items';
import { TestPaperSection } from './components/exam-items';
import { Options } from './components/question-items';
import { Result } from './components/result';

interface IProps {
  isResultPage: boolean;
  openExamSummary: () => void;
  toggleTimer: () => void;
  openInstruction: () => void;
}

export const Exam = observer(({ isResultPage, openExamSummary, toggleTimer, openInstruction }: IProps) => {
  const { testPaperStore, selectorStore, questionStore } = useStores();
  const { exam } = testPaperStore;
  const { selectedQuestion } = selectorStore;
  const { getSolutionByQuestionId, getOptionsByIds } = questionStore;
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (!exam) return;
    if (exam.isPractice) toggleTimer();
    else openInstruction();
  }, []);

  if (!exam) return <></>;

  if (!selectedQuestion) return <></>;

  const {
    numberOfQuestions,
    currentQuestionIndex,
    sectionObjects,
    selectedQuestionReplyTime,
    isSelectedQuestionCompleted,
    canShowAnswer,
    getResultByQuestionId,
    getResponsesByQuestionId,
    setResponse,
    getAnswersByQuestionId,
  } = exam;

  const handleResponses = (responses: string[]) => {
    setResponse(responses);
    setRefresh(!refresh);
  };

  const marks = selectedQuestion.markings[getResultByQuestionId(selectedQuestion._id)];

  return (
    <>
      {isResultPage ? (
        <Result />
      ) : (
        <>
          <div className="flex flex-col min-h-full py-4 md:py-6">
            <div className="grow-0 mb-3">
              <div className="flex space-x-4 items-start justify-between">
                <div className="px-0 md:px-12 flex flex-wrap justify-start items-center text-sm font-medium gap-1.5 md:gap-2">
                  <div className="hidden md:block">Sections :</div>
                  {sectionObjects.map((section) => (
                    <TestPaperSection section={section} key={section._id} />
                  ))}
                </div>
                <div className="px-2 md:px-12 flex xl:hidden items-center space-x-3" onClick={openExamSummary}>
                  <div className="text-sm blue-gradient font-semibold flex space-x-1 items-center">
                    <div className="">{currentQuestionIndex + 1}</div>
                    <div>/</div>
                    <div className="">{numberOfQuestions}</div>
                  </div>
                  <div>
                    <CaretDownIcon weight="bold" className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
            <div className="box-shadow grow-0 px-4 md:px-12 py-2 bg-background-primary">
              <div className="flex justify-between items-center text-sm md:text-base font-medium">
                <div className="flex justify-start items-center space-x-3">
                  <div className="">
                    {window.innerWidth < 768 ? 'Que' : 'Question'} {currentQuestionIndex + 1} :
                  </div>
                  <div className="text-violet-primary text-xs md:text-sm capitalize">
                    {splitCamelCase(selectedQuestion.questionType)}
                  </div>
                </div>
                <div className="flex justify-start items-center text-xs font-semibold space-x-3">
                  <div className="blue-gradient">{selectedQuestionReplyTime}</div>
                  {isSelectedQuestionCompleted ? (
                    <div className={`${marks > 0 ? 'text-green-primary' : 'text-red-primary'}`}>
                      {marks > 0 ? '+' : ''}
                      {marks}
                    </div>
                  ) : (
                    <>
                      <div className="text-green-primary">+{selectedQuestion.markings[Marking.CORRECT]}</div>
                      <div className="text-red-primary">-{-selectedQuestion.markings[Marking.INCORRECT]}</div>
                    </>
                  )}
                  <Bookmark collectionItem={selectedQuestion._id} collectionRef={CollectionType.QUESTION} />
                </div>
              </div>
            </div>
            <div className="grow py-0 h-0 w-full mt-2">
              <div className="box-shadow overflow-auto py-3 h-full px-4 md:px-12 bg-background-primary">
                <div className="">
                  <Html html={selectedQuestion.question || ''} />
                </div>
                <div className="mt-4">
                  <Options
                    question={selectedQuestion}
                    selectedValues={getResponsesByQuestionId(selectedQuestion._id)}
                    handleResponses={handleResponses}
                    isDisabled={isSelectedQuestionCompleted}
                    answers={isSelectedQuestionCompleted ? getAnswersByQuestionId(selectedQuestion._id) : []}
                  />
                </div>
                <div
                  className={`mt-8 mb-4 transition-all duration-500 ${isSelectedQuestionCompleted ? 'opacity-100' : 'opacity-0'}`}
                >
                  {isSelectedQuestionCompleted && selectedQuestion ? (
                    <Answer
                      correctOptionIndexes={selectedQuestion.correctOptionIndexes}
                      solution={getSolutionByQuestionId(selectedQuestion._id)?.solution || ''}
                      answers={getOptionsByIds(getAnswersByQuestionId(selectedQuestion._id)).map(
                        (option) => option.option,
                      )}
                      isAnswer={
                        ![QuestionType.BOOLEAN, QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE].includes(
                          selectedQuestion.questionType,
                        )
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
});
