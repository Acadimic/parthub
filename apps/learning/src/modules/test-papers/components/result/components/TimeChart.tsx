import { cn } from '@repo/ui/lib';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';
import { type IQuestionOutcome, formatMarks, formatSeconds } from '../analytics';
import {
  AXIS_TICK,
  CHART_CURSOR,
  CHART_GRID,
  CHART_MUTED_INK,
  ChartTooltip,
  MARKING_BG_CLASSES,
  MARKING_FILLS,
  MARKING_LABELS,
  MARKING_ORDER,
  MarkingLegend,
} from '../graphs';
import { type IResultAnalytics } from '../useResultAnalytics';
import { ResultCard } from './ResultCard';

const QuestionTooltip = ({ active, payload }: TooltipContentProps) => {
  const row = payload[0]?.payload as IQuestionOutcome | undefined;
  if (!active || !row) return null;
  return (
    <ChartTooltip
      title={`Question ${row.number} · ${row.sectionName}`}
      rows={[
        {
          label: MARKING_LABELS[row.marking],
          value: formatMarks(row.marks),
          swatchClassName: MARKING_BG_CLASSES[row.marking],
        },
        { label: 'Time spent', value: formatSeconds(row.timeSpent) },
        { label: 'Subject', value: row.subjectName },
      ]}
    />
  );
};

interface IProps {
  analytics: IResultAnalytics;
  onReviewQuestion: (questionId: string) => void;
}

/**
 * Where the minutes went: one column per question in paper order, coloured by its outcome, against
 * the average for an answered question. A column opens its question.
 */
export const TimeChart = ({ analytics, onReviewQuestion }: IProps) => {
  const { questions, averageTime, timeSpentByMarking, counts } = analytics;
  const total = Object.values(timeSpentByMarking).reduce((sum, seconds) => sum + seconds, 0);
  const present = MARKING_ORDER.filter((marking) => counts[marking] > 0);
  const tickInterval = Math.max(0, Math.ceil(questions.length / 20) - 1);

  return (
    <ResultCard title="Time per question" description="Click a column to open that question">
      <div className="overflow-x-auto">
        <div style={{ minWidth: Math.max(questions.length * 14, 320) }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={questions} margin={{ top: 16, right: 8, bottom: 0, left: -8 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />
              <XAxis dataKey="number" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={tickInterval} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                tickFormatter={(value: number) => formatSeconds(value)}
                width={56}
              />
              <Tooltip cursor={{ fill: CHART_CURSOR }} content={QuestionTooltip} />
              {averageTime ? (
                <ReferenceLine
                  y={averageTime}
                  stroke={CHART_MUTED_INK}
                  strokeDasharray="4 4"
                  label={{
                    value: `avg ${formatSeconds(averageTime)}`,
                    position: 'insideTopRight',
                    fill: CHART_MUTED_INK,
                    fontSize: 11,
                  }}
                />
              ) : null}
              <Bar
                dataKey="timeSpent"
                name="Time spent"
                maxBarSize={24}
                minPointSize={2}
                isAnimationActive={false}
                className="cursor-pointer"
                onClick={(entry) => onReviewQuestion((entry.payload as IQuestionOutcome).id)}
              >
                {questions.map((question) => (
                  <Cell key={question.id} fill={MARKING_FILLS[question.marking]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <MarkingLegend markings={present} className="mt-3" />
      {total ? (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 md:grid-cols-4">
          {present.map((marking) => (
            <div key={marking}>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn('inline-block h-2.5 w-2.5 rounded-sm', MARKING_BG_CLASSES[marking])} />
                {MARKING_LABELS[marking]}
              </div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                {formatSeconds(timeSpentByMarking[marking])}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {Math.round((timeSpentByMarking[marking] / total) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </ResultCard>
  );
};
