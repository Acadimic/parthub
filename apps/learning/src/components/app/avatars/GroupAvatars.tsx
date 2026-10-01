import { type IUser } from '@stores';
import { Tooltip } from '@repo/ui/app';
import { Avatar } from './Avatar';

interface IProps {
  users: IUser[];
  max?: number;
}

const UserInfo = ({ user }: { user: IUser }) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <Avatar key={user._id} id={user._id} name={user.name} avatar={user.avatar} />
        <div>
          <div>{user.name}</div>
          <div>{user.email && <span className="text-xs">{user.email}</span>}</div>
        </div>
      </div>
    </div>
  );
};

export const GroupAvatars = ({ users, max = 4 }: IProps) => {
  const total = users.length;

  return (
    <div className="flex items-center space-x-[-6px]">
      {users.slice(0, max).map((user) => (
        <Tooltip key={user._id} title={<UserInfo user={user} />}>
          <Avatar key={user._id} id={user._id} name={user.name} avatar={user.avatar} />
        </Tooltip>
      ))}
      {total > max && (
        <Tooltip
          title={
            <div className="flex flex-col gap-2">
              {users.slice(max).map((user) => (
                <UserInfo key={user._id} user={user} />
              ))}
            </div>
          }
        >
          <Avatar id={`${total - max}`} name={`+${total - max}`} bg="#9e9e9e" color="#fff" />
        </Tooltip>
      )}
    </div>
  );
};
