import { Button } from '@repo/ui/app';
import { CheckIcon, PlusIcon } from '@phosphor-icons/react';
import { type IUser, useResourceLookups } from '@stores';
import { errorToast } from '@utils/helpers';

interface IProps {
  user: IUser;
}

/** Follows the teacher. Primary until followed, then a quiet confirmation that toggles back. */
export const FollowButton = ({ user }: IProps) => {
  const resourceStore = useResourceLookups();
  const { toggleFollowing, isFollowing } = resourceStore;
  const isToggling = resourceStore.isLoading('toggleFollowing');
  const isFollowingUser = isFollowing(user._id);

  const handleToggle = async () => {
    await toggleFollowing(user._id);
    const error = resourceStore.getError('toggleFollowing');
    if (error) errorToast({ message: error });
  };

  return (
    <Button
      isRound
      isSecondary={isFollowingUser}
      aria-pressed={isFollowingUser}
      isLoading={isToggling}
      hideLoadingIcon
      disabled={user.isLoadingFollowersCount}
      className="px-3.5 py-1.5"
      onClick={handleToggle}
      leftsection={
        isFollowingUser ? (
          <CheckIcon weight="bold" className="h-4 w-4 text-success" />
        ) : (
          <PlusIcon weight="bold" className="h-4 w-4" />
        )
      }
    >
      {isFollowingUser ? 'Following' : 'Follow'}
    </Button>
  );
};
