import { type CourseDto } from '@repo/shared/contracts';
import { Card } from '@repo/ui/app';
import { MeetItem } from '@components/common';
import { BlankState } from '@components/others';
import { useMeetLookups } from '@stores';

interface IProps {
  course: CourseDto;
}

export const SessionsView = ({ course }: IProps) => {
  const meetStore = useMeetLookups();
  const { getMeetsByIds } = meetStore;
  const meets = getMeetsByIds(course.meets ?? []);

  return (
    <Card>
      <div className="flex flex-col gap-2">
        {meets.map((meet) => (
          <MeetItem key={meet._id} meet={meet} />
        ))}
      </div>
      <div className="flex justify-center items-center">
        {meets.length === 0 ? <BlankState label="No sessions added" /> : null}
      </div>
    </Card>
  );
};
