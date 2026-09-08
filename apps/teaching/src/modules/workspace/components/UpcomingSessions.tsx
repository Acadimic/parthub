import { MeetItem } from '@components/common';
import { useMeetLookups } from '@stores';

export const UpcomingSessions = () => {
  const meetStore = useMeetLookups();
  const todaysScheduledMeets = meetStore.getTodaysScheduledMeets();

  return (
    <div className="flex flex-col gap-2">
      {todaysScheduledMeets.map((meet) => (
        <MeetItem key={meet._id} meet={meet} />
      ))}
    </div>
  );
};
