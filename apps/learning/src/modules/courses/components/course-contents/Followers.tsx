import { RectangleSkeleton } from '@repo/ui/app';
import { type IUser } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

interface IProps {
  user: IUser;
}

export const Followers = observer(({ user }: IProps) => {
  useEffect(() => {
    if (!user.isLoadedFollowersCount) user.loadFollowersCount();
  }, [user.isLoadedFollowersCount]);

  return (
    <div className="flex items-center gap-2 mt-1 h-[16px]">
      {user.isLoadingFollowersCount ? (
        <RectangleSkeleton width={100} height={16} />
      ) : (
        <div className="text-xs font-medium text-color-secondary">{user.followersCount} followers</div>
      )}
    </div>
  );
});
