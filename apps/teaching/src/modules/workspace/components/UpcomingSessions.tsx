import { MeetItem } from '@components/common';
import { CalendarBlankIcon } from '@phosphor-icons/react';
import { useMeetLookups } from '@stores';
import Link from 'next/link';

export const UpcomingSessions = () => {
  const meetStore = useMeetLookups();
  const todaysScheduledMeets = meetStore.getTodaysScheduledMeets();

  // Without this the heading sat above an empty div on any day with nothing scheduled, which reads
  // as a page that failed to load rather than a day that is free.
  if (!todaysScheduledMeets.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-border px-4 py-8 text-center">
        <CalendarBlankIcon className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Nothing scheduled today</p>
        <Link href="/calender" className="text-sm font-medium text-info hover:underline">
          Open the calendar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {todaysScheduledMeets.map((meet) => (
        <MeetItem key={meet._id} meet={meet} />
      ))}
    </div>
  );
};
