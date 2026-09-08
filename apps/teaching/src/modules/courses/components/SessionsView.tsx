import { Card } from '@repo/ui/app';
import { MeetItem } from '@components/common';
import { BlankState } from '@components/others';
import { type ICourse, useMeetLookups } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  course: ICourse;
}

export const SessionsView = observer(({ course }: IProps) => {
  const meetStore = useMeetLookups();
  const { getMeetsByIds } = meetStore;
  const meets = getMeetsByIds(course.meets);

  return (
    <Card>
      <div className="flex flex-col gap-2">
        {meets.map((meet) => (
          <MeetItem key={meet._id} meet={meet} isSmallJoinable={true} />
        ))}
      </div>
      <div className="flex justify-center items-center">
        {meets.length === 0 ? <BlankState label="No sessions added" /> : null}
      </div>
    </Card>
  );
});
