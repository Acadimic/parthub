import { Button } from '@repo/ui/app';
import { type IColumnData, Table, Tabs } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { Marking } from '@enums';
import { ChartBarHorizontalIcon, TableIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';
import { GROUPING_LABELS, type Grouping, type IOutcomeGroup, formatMarks, formatSeconds } from '../analytics';
import {
  AXIS_TICK,
  CHART_CURSOR,
  CHART_GRID,
  CHART_MUTED_INK,
  CHART_SURFACE,
  ChartTooltip,
  MARKING_BG_CLASSES,
  MARKING_FILLS,
  MARKING_LABELS,
  MARKING_ORDER,
  MarkingLegend,
} from '../graphs';
import { type IResultAnalytics } from '../useResultAnalytics';
import { ResultCard } from './ResultCard';

type View = 'chart' | 'table';

/** The label at a bar's end: how accurate the answered questions were, if any were. */
const describeAccuracy = (group: IOutcomeGroup) => {
  const answered = group.counts[Marking.CORRECT] + group.counts[Marking.INCORRECT];
  return answered ? `${group.accuracy}% accurate` : 'none answered';
};

/** The outcome whose segment sits at the end of a row's stack. */
const lastPresent = (group: IOutcomeGroup, markings: Marking[]) =>
  [...markings].reverse().find((marking) => group.counts[marking] > 0);

const GroupTooltip = ({ active, payload }: TooltipContentProps) => {
  const row = payload[0]?.payload as IOutcomeGroup | undefined;
  if (!active || !row) return null;
  return (
    <ChartTooltip
      title={`${row.name} · ${row.total} ${row.total === 1 ? 'question' : 'questions'}`}
      rows={[
        ...MARKING_ORDER.filter((marking) => row.counts[marking] > 0).map((marking) => ({
          label: MARKING_LABELS[marking],
          value: row.counts[marking],
          swatchClassName: MARKING_BG_CLASSES[marking],
        })),
        { label: 'Marks', value: `${formatMarks(row.marks)} / ${row.maxMarks}` },
        { label: 'Accuracy', value: `${row.accuracy}%` },
        { label: 'Time', value: formatSeconds(row.timeSpent) },
      ]}
    />
  );
};

const GroupChart = ({ groups, markings }: { groups: IOutcomeGroup[]; markings: Marking[] }) => {
  const height = Math.max(160, groups.length * 44 + 36);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={groups} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 0 }} barCategoryGap={12}>
        <CartesianGrid horizontal={false} stroke={CHART_GRID} strokeWidth={1} />
        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={AXIS_TICK} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          axisLine={false}
          tickLine={false}
          tick={{ ...AXIS_TICK, fontWeight: 500 }}
        />
        <Tooltip cursor={{ fill: CHART_CURSOR }} content={GroupTooltip} />
        {markings.map((marking) => (
          <Bar
            key={marking}
            dataKey={(row: IOutcomeGroup) => row.counts[marking]}
            name={MARKING_LABELS[marking]}
            stackId="outcome"
            fill={MARKING_FILLS[marking]}
            stroke={CHART_SURFACE}
            strokeWidth={2}
            barSize={20}
            isAnimationActive={false}
          >
            {/* A zero-width segment draws no label, so each bar labels only the rows it ends. */}
            <LabelList
              dataKey={(row: IOutcomeGroup) =>
                lastPresent(row, markings) === marking ? describeAccuracy(row) : undefined
              }
              position="right"
              offset={10}
              fill={CHART_MUTED_INK}
              fontSize={12}
            />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

const getColumns = (grouping: Grouping, markings: Marking[]): IColumnData<IOutcomeGroup>[] => [
  {
    key: 'name',
    label: GROUPING_LABELS[grouping],
    isSortable: true,
    render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
  },
  ...markings.map((marking): IColumnData<IOutcomeGroup> => ({
    key: marking,
    label: MARKING_LABELS[marking],
    isSortable: true,
    className: 'text-right font-mono',
    sortValue: (row) => row.counts[marking],
    render: (row) => row.counts[marking],
  })),
  {
    key: 'marks',
    label: 'Marks',
    isSortable: true,
    className: 'text-right font-mono whitespace-nowrap',
    render: (row) => `${formatMarks(row.marks)} / ${row.maxMarks}`,
  },
  {
    key: 'accuracy',
    label: 'Accuracy',
    isSortable: true,
    className: 'text-right font-mono',
    render: (row) => `${row.accuracy}%`,
  },
  {
    key: 'timeSpent',
    label: 'Time',
    isSortable: true,
    className: 'text-right font-mono whitespace-nowrap',
    render: (row) => formatSeconds(row.timeSpent),
  },
];

const ViewToggle = ({ view, onChange }: { view: View; onChange: (view: View) => void }) => (
  <div role="group" aria-label="Show as" className="flex rounded-lg border border-border p-0.5">
    {(
      [
        { value: 'chart', label: 'Chart', icon: ChartBarHorizontalIcon },
        { value: 'table', label: 'Table', icon: TableIcon },
      ] as const
    ).map((option) => (
      <Button
        key={option.value}
        isSubtle
        aria-pressed={view === option.value}
        aria-label={option.label}
        className={cn('rounded-md px-2 py-1', view === option.value && 'bg-accent text-accent-foreground')}
        onClick={() => onChange(option.value)}
        leftsection={<option.icon weight="bold" className="h-4 w-4" />}
      />
    ))}
  </div>
);

interface IProps {
  analytics: IResultAnalytics;
}

/**
 * Where the marks came from: the outcomes stacked per section, subject, chapter or difficulty,
 * whichever of those actually split the paper, with the same figures as a table one click away.
 */
export const BreakdownChart = ({ analytics }: IProps) => {
  const [view, setView] = useState<View>('chart');
  const { groupings, groups, counts } = analytics;
  if (!groupings.length) return null;

  // Partially correct only appears when the paper has it, so it does not clutter every chart.
  const markings = MARKING_ORDER.filter((marking) => marking !== Marking.PARTIALLY_CORRECT || counts[marking] > 0);

  const renderPanel = (grouping: Grouping) => (
    <div className="pt-4">
      {view === 'chart' ? (
        <>
          <GroupChart groups={groups[grouping]} markings={markings} />
          <MarkingLegend markings={markings} className="mt-3" />
        </>
      ) : (
        <Table columns={getColumns(grouping, markings)} rows={groups[grouping]} />
      )}
    </div>
  );

  return (
    <ResultCard
      title="Performance breakdown"
      description="Outcomes per group, with how accurate the answered ones were"
      actions={<ViewToggle view={view} onChange={setView} />}
    >
      {groupings.length === 1 ? (
        renderPanel(groupings[0])
      ) : (
        <Tabs
          tabs={groupings.map((grouping) => ({ label: GROUPING_LABELS[grouping], component: renderPanel(grouping) }))}
        />
      )}
    </ResultCard>
  );
};
