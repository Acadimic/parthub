import { Avatar } from './Avatar';

export interface IAvatarWithNameProps {
  id?: string;
  name: string;
  avatar?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}

export const AvatarWithName = ({ id, name, avatar, src, size, className }: IAvatarWithNameProps) => {
  const avatarSrc = avatar ?? src;
  return (
    <div className={`flex items-center gap-2 border border-color-border ${className || ''}`}>
      <div>
        <Avatar avatar={avatarSrc} id={id || name} name={name} size={size} className="rounded-none text-xs" />
      </div>
      <div className="max-w-[120px] truncate py-1 text-xs pr-2">{name}</div>
    </div>
  );
};
