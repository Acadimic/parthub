import { type MeetDto } from '@repo/shared/contracts';
import { Card } from '@repo/ui/app';
import { CopyUrl } from '@components/common';
import { JoiningLink, MeetingTitle } from '@modules/calender/components';
import { getFormattedTime, getFrequencyText, getStringFormattedDate } from '@utils/helpers';

interface IProps {
  meet: MeetDto;
  isSmallJoinable?: boolean;
  isCopyIconOnly?: boolean;
}

export const MeetItem = ({ meet, isSmallJoinable = false, isCopyIconOnly = false }: IProps) => {
  const onClickMeet = () => {
    if (meet.meetingLink) {
      window.open(meet.meetingLink, '_blank');
    }
  };

  return (
    <Card className="px-3 py-2 border border-color-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-2">
        <div className="max-w-full md:max-w-[50%] cursor-pointer" onClick={onClickMeet}>
          <MeetingTitle meet={meet} />
        </div>
        <div className="text-xs text-color-secondary font-medium text-center md:max-w-[36%]">
          <div>
            {getStringFormattedDate(new Date())} {meet.startTime ? getFormattedTime(meet.startTime) : ''} -{' '}
            {meet.endTime ? getFormattedTime(meet.endTime) : ''}
          </div>
          {meet.startTime ? <div>{getFrequencyText([...(meet.weekDays ?? [])], meet.startTime)}</div> : null}
        </div>
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-2 w-full">
            <div className="">
              <CopyUrl url={meet.meetingLink ?? ''} isCopyIconOnly={isCopyIconOnly} />
            </div>
            <div className="flex-1">
              <JoiningLink url={meet.meetingLink ?? ''} isSmall={isSmallJoinable} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
