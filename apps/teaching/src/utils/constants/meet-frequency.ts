import { MeetFrequency } from '@enums';

/** How a session recurs: once, on chosen weekdays until the week ends, or on chosen weekdays indefinitely. */
export type RecurrenceKind = 'once' | 'thisWeek' | 'ongoing';

export interface IMeetFrequencyMeta {
  label: string;
  /** One line under the label in the picker. */
  description: string;
  kind: RecurrenceKind;
  /** Whether the author chooses weekdays. Daily is every day, so there is nothing to choose. */
  picksWeekDays: boolean;
  /** The weekdays a session gets when this frequency is chosen, given its start date. */
  defaultWeekDays: (start: Date) => number[];
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * Everything the app knows about a frequency, in one place.
 *
 * The form, the calendar expansion and the store used to each carry their own `if` chain over the
 * enum, so adding a frequency meant finding every chain. A new member now needs one row here and,
 * when it recurs in a new way, one new `kind`.
 */
export const MEET_FREQUENCIES: Record<MeetFrequency, IMeetFrequencyMeta> = {
  [MeetFrequency.ONE_TIME]: {
    label: 'Once',
    description: 'A single session on the chosen date.',
    kind: 'once',
    picksWeekDays: false,
    defaultWeekDays: () => [],
  },
  [MeetFrequency.DAILY]: {
    label: 'Daily',
    description: 'Every day from the start date.',
    kind: 'ongoing',
    picksWeekDays: false,
    defaultWeekDays: () => ALL_DAYS,
  },
  [MeetFrequency.WEEKLY]: {
    label: 'Weekly',
    description: 'On the chosen weekdays, every week.',
    kind: 'ongoing',
    picksWeekDays: true,
    defaultWeekDays: (start) => [start.getDay()],
  },
  [MeetFrequency.THIS_WEEK]: {
    label: 'This week only',
    description: 'On the chosen weekdays, then it stops.',
    kind: 'thisWeek',
    picksWeekDays: true,
    defaultWeekDays: (start) => [start.getDay()],
  },
};

/** The order the picker shows them: from the simplest to the most specific. */
export const MEET_FREQUENCY_ORDER: MeetFrequency[] = [
  MeetFrequency.ONE_TIME,
  MeetFrequency.DAILY,
  MeetFrequency.WEEKLY,
  MeetFrequency.THIS_WEEK,
];

/** A saved session with no frequency is treated as a one-off, which is the only reading that shows it at all. */
export const getMeetFrequencyMeta = (frequency?: MeetFrequency): IMeetFrequencyMeta =>
  MEET_FREQUENCIES[frequency ?? MeetFrequency.ONE_TIME];
