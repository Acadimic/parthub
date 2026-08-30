import { MeetItem } from '@components/common';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';

export const UpcomingSessions = observer(() => {
  const { meetStore } = useStores();
  const { todaysScheduledMeets } = meetStore;

  return (
    <div className="flex flex-col gap-2">
      {todaysScheduledMeets.map((meet) => (
        <MeetItem key={meet._id} meet={meet} />
      ))}
    </div>
  );
});
