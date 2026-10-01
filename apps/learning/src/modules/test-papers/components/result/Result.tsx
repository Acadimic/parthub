import { BreakdownChart, Insights, OutcomeBar, QuestionGrid, ScoreHero, TimeChart } from './components';
import { useResultAnalytics } from './useResultAnalytics';

interface IProps {
  /** Leaves the result for the paper, open at the given question. */
  onReviewQuestion: (questionId: string) => void;
}

/**
 * The result of a sitting, headline first: the score and verdict, then how the paper split, where
 * the marks came from, where the time went, and every question as a way back into the paper.
 */
export const Result = ({ onReviewQuestion }: IProps) => {
  const analytics = useResultAnalytics();
  if (!analytics) return null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 py-4 md:gap-5 md:py-6">
      <ScoreHero analytics={analytics} />
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <OutcomeBar analytics={analytics} />
        </div>
        <div className="lg:col-span-2">
          <Insights insights={analytics.insights} />
        </div>
      </div>
      <BreakdownChart analytics={analytics} />
      <TimeChart analytics={analytics} onReviewQuestion={onReviewQuestion} />
      <QuestionGrid analytics={analytics} onReviewQuestion={onReviewQuestion} />
    </div>
  );
};
