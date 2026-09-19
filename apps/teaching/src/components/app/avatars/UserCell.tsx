import { type IUser } from '@stores';
import { Avatar } from './Avatar';

/** A person in a table row: avatar, full name, and the email underneath. */
export const UserCell = ({ user }: { user: IUser }) => {
  const fullName = [user.name, user.lastName].filter(Boolean).join(' ');
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar id={user._id} name={user.name} avatar={user.photoUrl} size={36} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-semibold text-foreground">{fullName || user.email}</span>
        {user.email ? <span className="truncate text-xs text-muted-foreground">{user.email}</span> : null}
      </div>
    </div>
  );
};
