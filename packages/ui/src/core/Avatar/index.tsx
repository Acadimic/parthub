import { Avatar as ShadcnAvatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { cn } from '../../lib/cn';
import { Tooltip } from '../Tooltip';

interface IAvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const sizeMap = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar = ({ name, src, size = 'md', className, showTooltip = true }: IAvatarProps) => {
  const avatar = (
    <ShadcnAvatar className={cn(sizeMap[size], className)}>
      {src && <AvatarImage src={src} alt={name || 'avatar'} />}
      <AvatarFallback className="bg-blue-primary text-white font-semibold">{getInitials(name)}</AvatarFallback>
    </ShadcnAvatar>
  );

  if (showTooltip && name) {
    return <Tooltip title={name}>{avatar}</Tooltip>;
  }

  return avatar;
};

export type { IAvatarProps };
