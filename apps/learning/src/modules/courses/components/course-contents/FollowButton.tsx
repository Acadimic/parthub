import { Button } from '@repo/ui/app';
import { CheckIcon } from '@phosphor-icons/react';
import { type IUser, useResourceLookups } from '@stores';

interface IProps {
  user: IUser;
}

export const FollowButton = ({ user }: IProps) => {
  const resourceStore = useResourceLookups();
  const { toggleFollowing, isFollowing } = resourceStore;
  const isToggleFollowing = resourceStore.isLoading('toggleFollowing');

  const isFollowingUser = isFollowing(user._id);

  return (
    <Button
      // isLoading={isToggleFollowing}
      disabled={user.isLoadingFollowersCount}
      text={isFollowingUser ? 'Following' : 'Follow'}
      isRound
      onClick={() => toggleFollowing(user._id)}
      leftsection={isFollowingUser ? <CheckIcon weight="bold" className="w-5 h-5" /> : null}
    />
  );
};
