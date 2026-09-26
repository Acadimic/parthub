import { StatTile } from '@repo/ui/app';
import { type IActivitySummary } from '@interfaces';
import {
  BooksIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  PercentIcon,
  TimerIcon,
} from '@phosphor-icons/react';

/** "42s", "1m 8s", "2h 5m": short enough for a tile, unlike the long form the exam uses. */
const getCompactDuration = (totalSecs: number) => {
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours) return `${hours}h ${mins}m`;
  if (mins) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

/** The headline numbers: how much has been done, and how well. */
export const ActivitySummary = ({ summary }: { summary: IActivitySummary }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
    <StatTile icon={BooksIcon} value={summary.startedCourses} label="Courses started" />
    <StatTile icon={CheckCircleIcon} value={summary.lessonsCompleted} label="Lessons done" />
    <StatTile icon={ClipboardTextIcon} value={summary.testsAttempted} label="Tests taken" />
    <StatTile icon={PercentIcon} value={`${summary.averagePercent}%`} label="Average score" />
    <StatTile icon={TimerIcon} value={getCompactDuration(summary.testTimeSecs)} label="Time in tests" />
    <StatTile icon={CalendarCheckIcon} value={`${summary.activeDaysLast30}/30`} label="Active days" />
  </div>
);
