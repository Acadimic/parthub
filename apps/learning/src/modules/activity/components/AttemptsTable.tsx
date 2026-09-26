import { Link } from '@repo/ui/app';
import { Badge, type IColumnData, Table } from '@repo/ui/core';
import { BlankState } from '@components/others';
import { type ITestActivity } from '@interfaces';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { getFormattedTime, getMinutesString, getStringFormattedDate } from '@utils/helpers';

const getScoreTone = (percent: number) => {
  if (percent >= 75) return 'success';
  if (percent >= 40) return 'warning';
  return 'destructive';
};

const columns: IColumnData<ITestActivity>[] = [
  {
    key: 'title',
    label: 'Paper',
    isSortable: true,
    className: 'min-w-[14rem]',
    render: (row) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{row.title}</div>
        <div className="truncate text-xs text-muted-foreground">{row.courseName}</div>
      </div>
    ),
  },
  {
    key: 'at',
    label: 'Date',
    isSortable: true,
    className: 'whitespace-nowrap',
    render: (row) => (
      <div>
        <div>{getStringFormattedDate(row.at)}</div>
        <div className="text-xs text-muted-foreground">{getFormattedTime(row.at)}</div>
      </div>
    ),
  },
  {
    key: 'marksObtained',
    label: 'Score',
    isSortable: true,
    className: 'whitespace-nowrap',
    render: (row) => (
      <span className="font-mono">
        {row.marksObtained}/{row.maxMarks}
      </span>
    ),
  },
  {
    key: 'percent',
    label: 'Result',
    isSortable: true,
    render: (row) => <Badge tone={getScoreTone(row.percent)}>{row.percent}%</Badge>,
  },
  {
    key: 'accuracy',
    label: 'Accuracy',
    isSortable: true,
    className: 'whitespace-nowrap',
    render: (row) => (
      <div>
        <div className="font-mono">{row.accuracy}%</div>
        <div className="text-xs text-muted-foreground">
          {row.correct} right · {row.incorrect} wrong · {row.unattempted} skipped
        </div>
      </div>
    ),
  },
  {
    key: 'timeSpentSecs',
    label: 'Time',
    isSortable: true,
    className: 'whitespace-nowrap',
    render: (row) => getMinutesString(row.timeSpentSecs),
  },
  {
    key: 'open',
    label: '',
    className: 'w-px whitespace-nowrap',
    render: (row) => (
      <Link
        href={`/courses/${row.courseId}/modules`}
        isSubtle
        className="px-2 py-1 text-xs text-primary"
        rightsection={<ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />}
      >
        Open course
      </Link>
    ),
  },
];

/** The same row as a card, for a phone, where seven columns would not fit. */
const AttemptCard = ({ attempt }: { attempt: ITestActivity }) => (
  <li className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{attempt.title}</div>
        <div className="truncate text-xs text-muted-foreground">{attempt.courseName}</div>
      </div>
      <Badge tone={getScoreTone(attempt.percent)} appearance="solid">
        {attempt.marksObtained}/{attempt.maxMarks}
      </Badge>
    </div>
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>
        {getStringFormattedDate(attempt.at)} · {getFormattedTime(attempt.at)}
      </span>
      <span>{attempt.accuracy}% accuracy</span>
      <span>{getMinutesString(attempt.timeSpentSecs)}</span>
    </div>
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        {attempt.correct} right · {attempt.incorrect} wrong · {attempt.unattempted} skipped
      </span>
      <Link
        href={`/courses/${attempt.courseId}/modules`}
        isSubtle
        className="px-2 py-1 text-xs text-primary"
        rightsection={<ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />}
      >
        Open
      </Link>
    </div>
  </li>
);

/** Every attempt in one sortable table, or a list of cards on a phone. */
export const AttemptsTable = ({ attempts }: { attempts: ITestActivity[] }) => {
  if (!attempts.length) {
    return (
      <BlankState
        label="No test attempts yet"
        description="Sit a test paper from any course and your scores will be listed here."
      />
    );
  }
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {attempts.map((attempt) => (
          <AttemptCard key={attempt.id} attempt={attempt} />
        ))}
      </ul>
      <div className="hidden rounded-xl border border-border bg-background md:block">
        <Table rows={attempts} columns={columns} />
      </div>
    </>
  );
};
