import { type MeetDto } from '@repo/shared/contracts';
import { MeetItem } from '@components/meet';
import { BlankState } from '@components/others';

interface IProps {
  meets: MeetDto[];
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
