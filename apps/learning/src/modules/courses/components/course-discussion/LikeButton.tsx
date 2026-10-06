import { type CollectionType } from '@enums';
import { LikeToggle } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { useDiscussionLookups, useResourceLookups, useResourceStore, useSelectedUser } from '@stores';
import { errorToast } from '@utils/helpers';

interface IProps {
  itemId: string;
  collectionRef: CollectionType.COURSE_COMMENT | CollectionType.COURSE_REVIEW;
}

/** The learner's likes, loaded once for whichever like button renders first. */
const LoadMyLikes = () => {
  useLoadOnce(useResourceStore, 'reactions', (state) => state.loadReactions);
  return null;
};

/**
 * A thumbs-up with its count. Toggling goes through the same reactions a lesson's like uses, and
 * shows at once; a visitor with no session sees the count only.
 */
export const LikeButton = ({ itemId, collectionRef }: IProps) => {
  const isSignedIn = Boolean(useSelectedUser());
  const { getLikes } = useDiscussionLookups();
  const resourceStore = useResourceLookups();

  const toggle = async () => {
    await resourceStore.toggleReaction(itemId, collectionRef);
    const error = useResourceStore.getState().getError('toggleReaction');
    if (error) errorToast({ message: error });
  };

  return (
    <>
      {isSignedIn ? <LoadMyLikes /> : null}
      <LikeToggle
        count={getLikes(itemId)}
        isLiked={isSignedIn && resourceStore.isReacted(itemId)}
        disabledHint={isSignedIn ? null : 'Sign in to like'}
        onToggle={toggle}
      />
    </>
  );
};
