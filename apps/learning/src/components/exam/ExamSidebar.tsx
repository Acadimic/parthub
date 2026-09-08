import { Button } from '@repo/ui/app';
import { SubmitButton } from '@components/exam';
import { Marking } from '@enums';
import { TestPaperSection } from '@modules/test-papers/components/exam-items';
import { CaretDoubleRightIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { getPlural } from '@utils/helpers';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import {
  Answered,
  AnsweredReviewed,
  NotAnswered,
  NotVisited,
  Reviewed,
} from '../../modules/test-papers/components/summary-items';

interface IProps {
  closeExamSummary: () => void;
  openInstruction: () => void;
  openSubmitSummary: () => void;
  openResultPage: () => void;
  isResultPage: boolean;
}

export const ExamSidebar = observer(
  ({ isResultPage, closeExamSummary, openInstruction, openSubmitSummary, openResultPage }: IProps) => {
    const { testPaperStore, selectorStore } = useStores();
    const [isOpen, setIsOpen] = useState(true);
    const { exam, getTestPaperSectionById } = testPaperStore;
    const { setSelectedQuestionId } = selectorStore;

    if (isResultPage || !exam) return <></>;

    const handleClick = () => {
      setIsOpen(!isOpen);
    };

    const {
      isSubmitted,
      isPractice,
      sections,
      getQuestionIdsBySectionId,
      getResultByQuestionId,
      resultCounts,
      summaryCounts,
      isResponded,
      isVisited,
      isMarkedForReview,
      getQuestionIndexByQuestionId,
      setVisited,
    } = exam;

    const handleQuestionChange = (questionId: string) => {
      setSelectedQuestionId(questionId);
      setVisited(questionId);
      closeExamSummary && closeExamSummary();
    };

    const getQuestionItem = (questionId: string, index: number) => {
      const value = getQuestionIndexByQuestionId(questionId) + 1;
      const isMarkForReview = isMarkedForReview(questionId);
      const isAnswered = isResponded(questionId);
      if (isMarkForReview && isAnswered) {
        return <AnsweredReviewed count={value} isLarge />;
      }
      if (isMarkForReview) {
        return <Reviewed count={value} isLarge />;
      }
      if (isAnswered) {
        return <Answered count={value} isLarge />;
      }
      if (isVisited(questionId)) {
        return <NotAnswered count={value} isLarge />;
      }
      return <NotVisited count={value} isLarge />;
    };

    const getAnsweredItem = (questionId: string, index: number) => {
      const result = getResultByQuestionId(questionId);
      const value = getQuestionIndexByQuestionId(questionId) + 1;
      if (result === Marking.UNATTEMPTED) {
        return <NotVisited count={value} isLarge />;
      }
      if (result === Marking.CORRECT) {
        return <Answered count={value} isLarge />;
      }
      if (result === Marking.PARTIALLY_CORRECT) {
        return <Reviewed count={value} isLarge />;
      }
      return <NotAnswered count={value} isLarge />;
    };

    return (
      <div
        className={`bg-background-primary ${
          isOpen ? 'w-full xl:w-[380px] max-w-full xl:max-w-[380px]' : 'w-0'
        } h-full duration-300 xl:border-l border-color-border transition-width transition-slowest ease`}
      >
        <div className={`w-full h-full relative`}>
          <div className="hidden xl:block absolute top-[calc(50%-20px)] -ml-6">
            <button
              className="bg-blue-gradient h-10 w-6 flex justify-center items-center rounded-l-md app-shadow"
              onClick={handleClick}
            >
              <CaretDoubleRightIcon weight="bold" className={`text-white w-4 h-4 ${isOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>
          <div className={`${isOpen ? 'block' : 'hidden'} flex flex-col h-full transition-slowest`}>
            <div className={`${isOpen ? 'block' : 'hidden'} flex-none`}>
              <div className={`pl-4 py-6 grid grid-cols-3 gap-x-1.5 gap-y-2.5`}>
                {isSubmitted || isPractice ? (
                  <>
                    <Answered title="Correct" count={resultCounts[Marking.CORRECT]} />
                    <NotAnswered title="Incorrect" count={resultCounts[Marking.INCORRECT]} />
                    <NotVisited title="Unattempted" count={resultCounts[Marking.UNATTEMPTED]} />
                    <div className="col-span-2 max-w-[150px]">
                      <Reviewed title="Partially Correct" count={resultCounts[Marking.PARTIALLY_CORRECT]} />
                    </div>
                  </>
                ) : (
                  <>
                    <Answered title="Answered" count={summaryCounts.answered} />
                    <NotAnswered title="Not Answered" count={summaryCounts.notAnswered} />
                    <NotVisited title="Not Visited" count={summaryCounts.notVisited} />
                    <Reviewed title="Marked for Review" count={summaryCounts.markedForReview} />
                    <div className="col-span-2 max-w-[150px]">
                      <AnsweredReviewed
                        title="Answered & Marked for Review"
                        count={summaryCounts.answeredAndMarkedForReview}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="px-4 pb-2.5 pt-0.5 flex justify-center">
              <Button isSecondary isRound text="View Instructions" className="text-xs px-4" onClick={openInstruction} />
            </div>
            <div className="grow flex flex-col h-full overflow-auto">
              {sections.map((sectionId: string) => {
                const section = getTestPaperSectionById(sectionId);
                const questionIds = getQuestionIdsBySectionId(sectionId);
                if (!section) return null;
                return (
                  <div className="flex flex-col h-full" key={sectionId}>
                    <div className="flex flex-none space-x-4 px-4 py-2.5">
                      <div className="flex justify-start items-center text-sm font-medium gap-2 flex-wrap">
                        <div className="text-xs flex flex-nowrap">Section :</div>
                        <TestPaperSection section={section} />
                        <div className="text-xs text-color-secondary font-medium">
                          {questionIds.length} {getPlural(questionIds.length, 'Question')}
                        </div>
                      </div>
                    </div>
                    <div className="grow px-3 py-6 border-y border-color-border border-dotted">
                      <div className="grid grid-cols-5 gap-3">
                        {questionIds.map((questionId: string, index: number) => {
                          return (
                            <button
                              className={`flex justify-center items-start`}
                              key={index}
                              onClick={() => handleQuestionChange(questionId)}
                            >
                              <div>
                                {isSubmitted || isPractice
                                  ? getAnsweredItem(questionId, index)
                                  : getQuestionItem(questionId, index)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex flex-none xl:hidden justify-center py-12">
                <SubmitButton openResultPage={openResultPage} openSubmitSummary={openSubmitSummary} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
