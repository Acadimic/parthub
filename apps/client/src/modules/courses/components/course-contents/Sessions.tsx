import { MeetItem } from '@components/meet';
import { BlankState } from '@components/others';
import { IMeet } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  meets: IMeet[];
  isSmallJoinable?: boolean;
  isCopyIconOnly?: boolean;
}

export const Sessions = observer(({ meets, isSmallJoinable = false, isCopyIconOnly = false }: IProps) => {
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
});
