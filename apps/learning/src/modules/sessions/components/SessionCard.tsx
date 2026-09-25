import { type MeetDto } from '@repo/shared/contracts';
import { MeetStatus } from '@enums';
import { Badge, Card } from '@repo/ui/core';
import { Link } from '@repo/ui/app';
import { CalendarBlankIcon, ClockIcon, VideoCameraIcon } from '@phosphor-icons/react';
import { getFormattedTime, getFullFormattedDate } from '@utils/helpers';

const STATUS_TONE: Record<MeetStatus, 'info' | 'success' | 'neutral' | 'destructive'> = {
  [MeetStatus.SCHEDULED]: 'info',
  [MeetStatus.LIVE]: 'success',
  [MeetStatus.COMPLETED]: 'neutral',
  [MeetStatus.CANCELLED]: 'destructive',
};

interface IProps {
  meet: MeetDto;
}

export const SessionCard = ({ meet }: IProps) => {
  const status = meet.status ?? MeetStatus.SCHEDULED;
  // A cancelled session keeps its row but must not offer a way in.
  const canJoin = !!meet.meetingLink && status !== MeetStatus.CANCELLED && status !== MeetStatus.COMPLETED;

  return (
    <Card className="flex h-full flex-col gap-3 rounded-lg border px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{meet.title}</h3>
        <Badge tone={STATUS_TONE[status]} withDot className="capitalize">
          {status}
        </Badge>
      </div>

      {meet.description && <p className="line-clamp-2 text-sm text-muted-foreground">{meet.description}</p>}

      <div className="mt-auto flex flex-col gap-1.5 text-sm text-muted-foreground">
        {meet.startTime && (
          <div className="flex items-center gap-2">
            <CalendarBlankIcon className="h-4 w-4 shrink-0" />
            <span>{getFullFormattedDate(meet.startTime)}</span>
          </div>
        )}
        {meet.startTime && (
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 shrink-0" />
            <span>
              {getFormattedTime(meet.startTime)}
              {meet.endTime ? ` – ${getFormattedTime(meet.endTime)}` : ''}
              {meet.durationMins ? ` · ${meet.durationMins} min` : ''}
            </span>
          </div>
        )}
      </div>

      {canJoin && (
        <div className="pt-1">
          <Link href={meet.meetingLink as string} target="_blank" className="px-4 py-2 text-sm">
            <span className="flex items-center gap-2">
              <VideoCameraIcon className="h-4 w-4" />
              Join Session
            </span>
          </Link>
        </div>
      )}
    </Card>
  );
};
