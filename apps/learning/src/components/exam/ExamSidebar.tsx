import { Button } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { Marking } from '@enums';
import { TestPaperSection } from '@modules/test-papers/components/exam-items';
import { CaretDoubleRightIcon, InfoIcon } from '@phosphor-icons/react';
import { useSelectorLookups, useTestPaperLookups } from '@stores';
import { getPlural } from '@utils/helpers';
import { type ReactNode } from 'react';
import { PALETTE_LABELS, PaletteTile, type PaletteStatus } from './PaletteTile';

interface IProps {
  closeExamSummary: () => void;
  openInstruction: () => void;
  isResultPage: boolean;
  /** Whether the pane is expanded. The layout owns it, so the footer can take over what the pane hides. */
  isOpen: boolean;
  /** Collapses or expands the pane. Absent in the sheet, which has no handle. */
  onToggle?: () => void;
  /** Pinned under the palette: the submit or result button when the palette is a pane. */
  footer?: ReactNode;
}

const RESULT_STATUS: Record<Marking, PaletteStatus> = {
  [Marking.CORRECT]: 'correct',
  [Marking.INCORRECT]: 'incorrect',
  [Marking.PARTIALLY_CORRECT]: 'partial',
  [Marking.UNATTEMPTED]: 'unattempted',
};

const LegendItem = ({ status, count }: { status: PaletteStatus; count: number }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <PaletteTile status={status} value={count} size="sm" />
    <span className="truncate">{PALETTE_LABELS[status]}</span>
  </div>
);

/**
 * The question palette: a legend of how many questions are in each state, then every question as
 * a tile to jump to. A fixed pane from `xl` up, a sheet below that.
 */
export const ExamSidebar = ({ isResultPage, closeExamSummary, openInstruction, isOpen, onToggle, footer }: IProps) => {
  const testPaperStore = useTestPaperLookups();
  const { setSelectedQuestionId, selectedQuestionId } = useSelectorLookups();
  const { exam, getTestPaperSectionById } = testPaperStore;

  if (isResultPage || !exam) return <></>;

  const { isSubmitted, isPractice, sections } = exam;
  const isMarked = isSubmitted || isPractice;
  const {
    getQuestionIdsBySectionId,
    getQuestionIndexByQuestionId,
    getResultByQuestionId,
    getResultCounts,
    getSummaryCounts,
    isMarkedForReview,
    isResponded,
    isVisited,
    setVisited,
  } = testPaperStore;

  const handleQuestionChange = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setVisited(questionId);
    closeExamSummary?.();
  };

  const getStatus = (questionId: string): PaletteStatus => {
    if (isMarked) return RESULT_STATUS[getResultByQuestionId(questionId)];
    const marked = isMarkedForReview(questionId);
    const answered = isResponded(questionId);
    if (marked && answered) return 'answeredMarked';
    if (marked) return 'marked';
    if (answered) return 'answered';
    if (isVisited(questionId)) return 'notAnswered';
    return 'notVisited';
  };

  const legend: { status: PaletteStatus; count: number }[] = isMarked
    ? [
        { status: 'correct', count: getResultCounts()[Marking.CORRECT] },
        { status: 'incorrect', count: getResultCounts()[Marking.INCORRECT] },
        { status: 'partial', count: getResultCounts()[Marking.PARTIALLY_CORRECT] },
        { status: 'unattempted', count: getResultCounts()[Marking.UNATTEMPTED] },
      ]
    : [
        { status: 'answered', count: getSummaryCounts().answered },
        { status: 'notAnswered', count: getSummaryCounts().notAnswered },
        { status: 'marked', count: getSummaryCounts().markedForReview },
        { status: 'answeredMarked', count: getSummaryCounts().answeredAndMarkedForReview },
        { status: 'notVisited', count: getSummaryCounts().notVisited },
      ];

  return (
    <div
      className={cn(
        'relative h-full bg-background transition-all duration-300 xl:border-l xl:border-border',
        isOpen ? 'w-full max-w-full xl:w-[380px] xl:max-w-[380px]' : 'w-0',
      )}
    >
      {onToggle ? (
        <div className="absolute -ml-6 hidden xl:block" style={{ top: 'calc(50% - 20px)' }}>
          <button
            type="button"
            aria-label={isOpen ? 'Hide question palette' : 'Show question palette'}
            className="flex h-10 w-6 items-center justify-center rounded-l-md bg-primary text-primary-foreground shadow-md"
            onClick={onToggle}
          >
            <CaretDoubleRightIcon weight="bold" className={cn('h-4 w-4', !isOpen && 'rotate-180')} />
          </button>
        </div>
      ) : null}
      <div className={cn('flex h-full flex-col', !isOpen && 'hidden')}>
        <div className="border-b border-border px-4 py-4">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {legend.map((item) => (
              <LegendItem key={item.status} status={item.status} count={item.count} />
            ))}
          </div>
          <div className="mt-3">
            <Button
              isSubtle
              className="px-2 py-1 text-xs text-primary"
              onClick={openInstruction}
              leftsection={<InfoIcon weight="bold" className="h-4 w-4" />}
            >
              View instructions
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {sections.map((sectionId: string, sectionIndex: number) => {
            const section = getTestPaperSectionById(sectionId);
            const questionIds = getQuestionIdsBySectionId(sectionId);
            if (!section) return null;
            return (
              <div key={sectionId} className="border-b border-border px-4 py-4">
                {/* The section on the left and its count on the right, on the grid's edges below. */}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <TestPaperSection
                    section={section}
                    index={sectionIndex}
                    isActive={!!selectedQuestionId && questionIds.includes(selectedQuestionId)}
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {questionIds.length} {getPlural(questionIds.length, 'question')}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2 xl:grid-cols-5">
                  {questionIds.map((questionId: string) => (
                    <button
                      key={questionId}
                      type="button"
                      aria-current={questionId === selectedQuestionId ? 'true' : undefined}
                      className="flex justify-center"
                      onClick={() => handleQuestionChange(questionId)}
                    >
                      <PaletteTile
                        status={getStatus(questionId)}
                        value={getQuestionIndexByQuestionId(questionId) + 1}
                        isCurrent={questionId === selectedQuestionId}
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {/* The same height as the question footer beside it, so the two bars read as one edge. */}
        {footer ? (
          <div className="flex h-14 shrink-0 items-center border-t border-border px-4 xl:h-16">{footer}</div>
        ) : null}
      </div>
    </div>
  );
};
