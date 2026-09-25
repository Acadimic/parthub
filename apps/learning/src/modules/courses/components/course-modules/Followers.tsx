import { RectangleSkeleton } from '@repo/ui/app';
import { type IUser, useUserLookups } from '@stores';
import { getPlural } from '@utils/helpers';
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
    <div className="flex h-4 items-center">
      {user.isLoadingFollowersCount ? (
        <RectangleSkeleton width={80} height={12} />
      ) : (
        <div className="text-xs text-muted-foreground">
          {user.followersCount ?? 0} {getPlural(user.followersCount ?? 0, 'follower')}
        </div>
      )}
    </div>
  );
};
