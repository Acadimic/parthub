import { Button } from '@repo/ui/app';
import { SubmitButton } from '@components/exam';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';

interface IProps {
  isResultPage: boolean;
  openResultPage: () => void;
  closeResultPage: () => void;
  openExit: () => void;
  openSubmitSummary: () => void;
  toggleTimer: () => void;
}

export const ExamFooter = observer(
  ({ isResultPage, openResultPage, closeResultPage, openExit, openSubmitSummary, toggleTimer }: IProps) => {
    const { back } = useRouter();
    const { testPaperStore } = useStores();
    const { exam } = testPaperStore;

    if (!exam) return null;
    const {
      selectNextQuestion,
      selectPrevQuestion,
      isSelectedQuestionMarkedForReview,
      isSelectedQuestionResponded,
      toggleSelectedQuestionMarkForReview,
      clearResponse,
      resetResponse,
      isPractice,
      isSubmitted,
      isLastQuestion,
    } = exam;

    const handleViewSolutionsClick = () => {
      closeResultPage();
      if (exam.isPractice) toggleTimer();
    };

    return (
      <>
        <div className="h-14 xl:h-16 footer-shadow border-t border-color-border">
          <div className="flex justify-between items-center h-full space-x-3">
            <div className="flex items-center w-full h-full px-4 md:px-8">
              {isResultPage ? (
                <div className="flex justify-between items-center w-full">
                  <Button isSubtle text="Exit" onClick={openExit} />
                  <Button text="View Solutions" onClick={handleViewSolutionsClick} />
                  <div>&nbsp;</div>
                </div>
              ) : (
                <>
                  <div className="flex grow w-full items-center justify-center">
                    <div className="flex justify-start w-full items-center space-x-2.5 md:space-x-4">
                      <div>
                        <Button
                          isRound
                          text="Prev"
                          onClick={selectPrevQuestion}
                          leftsection={<CaretLeftIcon weight="bold" className="w-4 h-4" />}
                        />
                      </div>
                      {isPractice || isSubmitted ? null : (
                        <Button
                          isSubtle
                          text={isSelectedQuestionMarkedForReview ? 'Clear From Review' : 'Mark For Review'}
                          onClick={toggleSelectedQuestionMarkForReview}
                          className="text-xs text-blue-primary"
                        />
                      )}
                      {!isSelectedQuestionResponded || isSubmitted ? null : (
                        <Button
                          isSubtle
                          text={isPractice ? 'Reset Answer' : 'Clear'}
                          onClick={isPractice ? resetResponse : clearResponse}
                          className="text-xs text-blue-primary"
                        />
                      )}
                      <div className="xl:hidden">
                        {isSubmitted && !isLastQuestion ? (
                          <Button isSubtle text="View Result" onClick={openResultPage} />
                        ) : null}
                      </div>
                    </div>
                    <div className="flex justify-end items-center space-x-3">
                      <div className="whitespace-nowrap">
                        {isLastQuestion ? (
                          <SubmitButton openSubmitSummary={openSubmitSummary} openResultPage={openResultPage} />
                        ) : (
                          <Button
                            isRound
                            rightsection={<CaretRightIcon weight="bold" className="w-4 h-4" />}
                            text="Next"
                            onClick={selectNextQuestion}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`hidden flex-none xl:flex w-[360px] justify-end ${isLastQuestion ? 'opacity-0' : ''}`}
                  >
                    <SubmitButton openSubmitSummary={openSubmitSummary} openResultPage={openResultPage} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  },
);
