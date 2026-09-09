import { MeetItem } from '@components/meet';
import { BlankState } from '@components/others';
import { type IMeet } from '@stores';

interface IProps {
  meets: IMeet[];
  isSmallJoinable?: boolean;
  isCopyIconOnly?: boolean;
}

export const Sessions = ({ meets, isSmallJoinable = false, isCopyIconOnly = false }: IProps) => {
  return (
    <>
      {meets.length ? (
        <div className="flex flex-col gap-2">
          {meets.map((meet) => (
            <MeetItem key={meet._id} meet={meet} isCopyIconOnly={isCopyIconOnly} isSmallJoinable={isSmallJoinable} />
          ))}
        </div>
      ) : (
        <div>
          <BlankState label="No sessions scheduled" />
        </div>
      )}
    </>
  );
};
