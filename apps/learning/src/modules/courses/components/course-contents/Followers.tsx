import { RectangleSkeleton } from '@repo/ui/app';
import { type IUser, useUserLookups } from '@stores';
import { useEffect } from 'react';

interface IProps {
  user: IUser;
}

export const Followers = ({ user }: IProps) => {
  const { loadFollowersCount } = useUserLookups();

  useEffect(() => {
    if (!user.isLoadedFollowersCount) loadFollowersCount(user._id);
  }, [user._id, user.isLoadedFollowersCount, loadFollowersCount]);

  return (
    <div className="flex items-center gap-2 mt-1 h-[16px]">
      {user.isLoadingFollowersCount ? (
        <RectangleSkeleton width={100} height={16} />
      ) : (
        <div className="text-xs font-medium text-color-secondary">{user.followersCount} followers</div>
      )}
    </div>
  );
};
