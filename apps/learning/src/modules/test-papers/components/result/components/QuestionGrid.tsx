import { Tooltip } from '@repo/ui/app';
import { PALETTE_LABELS, PaletteTile, type PaletteStatus } from '@components/exam';
import { Marking } from '@enums';
import { type IQuestionOutcome, formatMarks, formatSeconds } from '../analytics';
import { MARKING_ORDER, MarkingLegend } from '../graphs';
import { type IResultAnalytics } from '../useResultAnalytics';
import { ResultCard } from './ResultCard';

const RESULT_STATUS: Record<Marking, PaletteStatus> = {
  [Marking.CORRECT]: 'correct',
  [Marking.INCORRECT]: 'incorrect',
  [Marking.PARTIALLY_CORRECT]: 'partial',
  [Marking.UNATTEMPTED]: 'unattempted',
};

const describe = (question: IQuestionOutcome) =>
  `Question ${question.number}: ${PALETTE_LABELS[RESULT_STATUS[question.marking]]}, ${formatMarks(question.marks)} marks, ${formatSeconds(question.timeSpent)}`;

interface IProps {
  analytics: IResultAnalytics;
  onReviewQuestion: (questionId: string) => void;
}

/**
 * Every question as a tile in its outcome's colour, by section, to jump straight to the one worth
 * a second look. The palette is hidden on the result page, so this is where that navigation lives.
 */
export const QuestionGrid = ({ analytics, onReviewQuestion }: IProps) => {
  const { questions, counts } = analytics;
  const sections = questions.reduce<{ id: string; name: string; questions: IQuestionOutcome[] }[]>((list, question) => {
    const section = list.find((item) => item.id === question.sectionId);
    if (section) section.questions.push(question);
    else list.push({ id: question.sectionId, name: question.sectionName, questions: [question] });
    return list;
  }, []);
  const present = MARKING_ORDER.filter((marking) => counts[marking] > 0);

  return (
    <ResultCard title="Review the questions" description="Click a question to see its solution">
      <div className="flex flex-col gap-5">
        {sections.map((section) => (
          <div key={section.id}>
            {sections.length > 1 ? (
              <div className="mb-2 text-xs font-medium uppercase tracking-caps text-muted-foreground">
                {section.name}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {section.questions.map((question) => (
                <Tooltip key={question.id} title={describe(question)}>
                  <button
                    type="button"
                    aria-label={describe(question)}
                    onClick={() => onReviewQuestion(question.id)}
                    className="rounded-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <PaletteTile status={RESULT_STATUS[question.marking]} value={question.number} />
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
      </div>
      <MarkingLegend markings={present} className="mt-4" />
    </ResultCard>
  );
};
