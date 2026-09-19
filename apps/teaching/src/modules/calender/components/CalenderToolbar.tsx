import { Button } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import {
  CaretLeftIcon,
  CaretRightIcon,
  GridFourIcon,
  GridNineIcon,
  ListBulletsIcon,
  PlusIcon,
  RowsIcon,
} from '@phosphor-icons/react';
import { CalendarType, FCCalendarType } from '@enums';
import { CalendarTypeMap } from '@utils/constants';
import {
  addDaysToDate,
  addMonthsToDate,
  addWeeksToDate,
  capitalize,
  getEndOfWeek,
  getFormattedDate,
  getStartOfWeek,
  subtractDaysFromDate,
  subtractMonthsFromDate,
  subtractWeeksFromDate,
} from '@utils/helpers';
import type FullCalendar from '@fullcalendar/react';

interface IProps {
  calendarRef: React.RefObject<FullCalendar | null>;
  setCalenderType: (calenderType: CalendarType) => void;
  calendarType: CalendarType;
  setDate: (date: number) => void;
  selectedDate: number;
  handleCreateMeet: (date: Date) => void;
}

export const CalenderViewIconMap = {
  [FCCalendarType.DAY]: <RowsIcon weight="bold" className="h-4 w-4" />,
  [FCCalendarType.WEEK]: <GridFourIcon weight="bold" className="h-4 w-4" />,
  [FCCalendarType.MONTH]: <GridNineIcon weight="bold" className="h-4 w-4" />,
  [FCCalendarType.LIST]: <ListBulletsIcon weight="bold" className="h-4 w-4" />,
};

/** Moves the date one step for the view: a day, a week (list shows a week too), or a month. */
const step = (date: Date, calendarType: CalendarType, direction: 1 | -1): Date => {
  if (calendarType === CalendarType.DAY) return direction > 0 ? addDaysToDate(date, 1) : subtractDaysFromDate(date, 1);
  if (calendarType === CalendarType.MONTH) {
    return direction > 0 ? addMonthsToDate(date, 1) : subtractMonthsFromDate(date, 1);
  }
  return direction > 0 ? addWeeksToDate(date, 1) : subtractWeeksFromDate(date, 1);
};

/** The heading for the view's range, in a long form and a short one for phones. */
const rangeLabels = (date: Date, calendarType: CalendarType): { long: string; short: string } => {
  if (calendarType === CalendarType.DAY) {
    return { long: getFormattedDate(date, 'dddd, D MMMM YYYY'), short: getFormattedDate(date, 'ddd, D MMM') };
  }
  if (calendarType === CalendarType.MONTH) {
    return { long: getFormattedDate(date, 'MMMM YYYY'), short: getFormattedDate(date, 'MMM YYYY') };
  }
  const start = getStartOfWeek(date);
  const end = getEndOfWeek(date);
  return {
    long: `${getFormattedDate(start, 'D MMM')} – ${getFormattedDate(end, 'D MMM YYYY')}`,
    short: `${getFormattedDate(start, 'D MMM')} – ${getFormattedDate(end, 'D MMM')}`,
  };
};

/**
 * When a session made from the toolbar starts: the selected day at 9 in the morning, or, for today,
 * the next full hour. The selected date is a midnight timestamp, and a session at 12:00 AM is never
 * what anyone meant.
 */
const defaultSessionStart = (date: Date, calendarType: CalendarType): Date => {
  const now = new Date();
  // The selected date is the first day of the range being shown; when today is in that range it is
  // the day someone means, not the Sunday a week happens to start on.
  const isTodayInView =
    calendarType === CalendarType.DAY
      ? date.toDateString() === now.toDateString()
      : now >= date &&
        now <= (calendarType === CalendarType.MONTH ? addMonthsToDate(date, 1) : addWeeksToDate(date, 1));
  const start = new Date(isTodayInView ? now : date);
  start.setHours(isTodayInView ? now.getHours() + 1 : 9, 0, 0, 0);
  return start;
};

/** Day, week, month and list as one segmented control; labels drop to icons on a phone. */
const ViewSwitch = ({ value, onChange }: { value: CalendarType; onChange: (view: FCCalendarType) => void }) => (
  <div
    className="inline-flex rounded-md border border-border bg-background p-0.5"
    role="group"
    aria-label="Calendar view"
  >
    {Object.values(FCCalendarType).map((view) => {
      const type = CalendarTypeMap[view];
      const isActive = type === value;
      return (
        <button
          key={view}
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(view)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
          title={capitalize(type)}
        >
          {CalenderViewIconMap[view]}
          <span className="hidden md:inline">{capitalize(type)}</span>
        </button>
      );
    })}
  </div>
);

/**
 * The calendar's own toolbar, in place of FullCalendar's: Today and the arrows, the range being
 * shown, the view switch and Create. Two rows on a phone, one from the tablet up.
 */
export const CustomToolbar = ({
  calendarRef,
  setCalenderType,
  setDate,
  handleCreateMeet,
  calendarType,
  selectedDate,
}: IProps) => {
  // Read at call time: the ref is still empty on the first render, and bailing out until it was set
  // left the page with no toolbar at all when nothing else caused a re-render.
  const getApi = () => calendarRef.current?.getApi();
  const date = new Date(selectedDate);
  const labels = rangeLabels(date, calendarType);

  const handleToday = () => {
    getApi()?.today();
    setDate(Date.now());
  };

  const move = (direction: 1 | -1) => {
    const next = step(date, calendarType, direction);
    getApi()?.gotoDate(next);
    setDate(next.getTime());
  };

  const handleViewChange = (view: FCCalendarType) => {
    getApi()?.changeView(view);
    setCalenderType(CalendarTypeMap[view]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pb-3">
      <div className="flex items-center gap-1">
        <Button isSecondary text="Today" onClick={handleToday} />
        <Button isSubtle className="px-2 py-1.5" title="Previous" onClick={() => move(-1)}>
          <CaretLeftIcon weight="bold" className="h-4 w-4" />
        </Button>
        <Button isSubtle className="px-2 py-1.5" title="Next" onClick={() => move(1)}>
          <CaretRightIcon weight="bold" className="h-4 w-4" />
        </Button>
      </div>
      <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground sm:text-lg" aria-live="polite">
        <span className="sm:hidden">{labels.short}</span>
        <span className="hidden sm:inline">{labels.long}</span>
      </h2>
      <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end">
        <ViewSwitch value={calendarType} onChange={handleViewChange} />
        <Button
          leftsection={<PlusIcon weight="bold" className="h-4 w-4" />}
          onClick={() => handleCreateMeet(defaultSessionStart(date, calendarType))}
        >
          Create <span className="hidden sm:inline">session</span>
        </Button>
      </div>
    </div>
  );
};
