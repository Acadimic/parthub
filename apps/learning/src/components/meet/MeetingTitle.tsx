import { type MeetDto } from '@repo/shared/contracts';
import { CircleIcon } from '@phosphor-icons/react';
import { getEventColor } from '@themes';

interface IProps {
  meet: MeetDto;
  className?: string;
}

export const MeetingTitle = ({ meet, className }: IProps) => {
  const mode =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-1">
        <CircleIcon weight="fill" style={{ color: getEventColor(mode, meet.color) }} className="w-5 h-5" />
      </div>
      <div className={`font-medium ${className ? className : 'text-sm'}`}>
        <div className="line-clamp-1">{meet.title}</div>
        <div className="text-xs text-muted-foreground line-clamp-2">{meet.description}</div>
      </div>
    </div>
  );
};
