import { Circle } from '@phosphor-icons/react';
import { IMeet } from '@stores';
import { dark, light } from '@themes';
import { observer } from 'mobx-react-lite';

interface IProps {
  meet: IMeet;
  className?: string;
}

export const MeetingTitle = observer(({ meet, className }: IProps) => {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const colorObject = isDark ? dark : light;

  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-1">
        <Circle weight="fill" style={{ color: colorObject.colors[meet.color]?.primary }} className={`w-5 h-5`} />
      </div>
      <div className={`font-medium ${className ? className : 'text-sm'}`}>
        <div className="line-clamp-1">{meet.title}</div>
        <div className="text-xs text-color-secondary line-clamp-2">{meet.description}</div>
      </div>
    </div>
  );
});
