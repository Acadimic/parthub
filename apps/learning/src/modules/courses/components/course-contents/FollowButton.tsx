import { Button } from '@components/app';
import { CheckIcon } from '@phosphor-icons/react';
import { IUser, useStores } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  user: IUser;
}

export const FollowButton = observer(({ user }: IProps) => {
  const { resourceStore } = useStores();
  const { isToggleFollowing, toggleFollowing, isFollowing } = resourceStore;

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
});
