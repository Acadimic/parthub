import { MeetItem } from '@components/common';
import { useMeetLookups } from '@stores';
import { observer } from 'mobx-react-lite';

export const UpcomingSessions = observer(() => {
  const meetStore = useMeetLookups();
  const todaysScheduledMeets = meetStore.getTodaysScheduledMeets();

  return (
    <div className="flex flex-col gap-2">
      {todaysScheduledMeets.map((meet) => (
        <MeetItem key={meet._id} meet={meet} />
      ))}
    </div>
  );
});
