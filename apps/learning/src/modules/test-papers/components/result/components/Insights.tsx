import { LightbulbIcon } from '@phosphor-icons/react';
import { ResultCard } from './ResultCard';

interface IProps {
  insights: string[];
}

/** A few plain sentences on what the numbers say, for the learner who does not read charts. */
export const Insights = ({ insights }: IProps) => {
  if (!insights.length) return null;
  return (
    <ResultCard title="What stands out">
      <ul className="flex flex-col gap-2.5">
        {insights.map((insight) => (
          <li key={insight} className="flex items-start gap-2.5 text-sm text-foreground">
            <LightbulbIcon weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </ResultCard>
  );
};
