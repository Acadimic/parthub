import { Button, Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { CollectionType } from '@enums';
import { ThumbsUpIcon } from '@phosphor-icons/react';
import { type IMaterial, type ITestPaper, useMaterialLookups, useResourceLookups, useTestPaperLookups } from '@stores';
import { errorToast, getPlural } from '@utils/helpers';
import { useEffect } from 'react';

interface IProps {
  collectionItem: IMaterial | ITestPaper;
  collectionRef: CollectionType;
}

/** A thumbs-up that fills when the learner has liked the item, with the running count beside it. Sized for the lesson's action bar. */
export const LikeCourse = ({ collectionItem, collectionRef }: IProps) => {
  const resourceStore = useResourceLookups();
  const { loadReactionsCount: loadMaterialReactionsCount } = useMaterialLookups();
  const { loadReactionsCount: loadTestPaperReactionsCount } = useTestPaperLookups();
  const { isReacted, toggleReaction } = resourceStore;
  const isToggling = resourceStore.isLoading('toggleReaction');
  const collectionItemId = collectionItem._id;
  const isLiked = isReacted(collectionItemId);
  const count = collectionItem.reactionsCount ?? 0;
  const isCounting = Boolean(collectionItem.isLoadingReactionsCount);

  // `run` folds a failure into the request status rather than throwing, so surface it here.
  const handleToggle = async () => {
    await toggleReaction(collectionItemId, collectionRef);
    const error = resourceStore.getError('toggleReaction');
    if (error) errorToast({ message: error });
  };

  useEffect(() => {
    if (collectionItem.isLoadedReactionsCount) return;
    // The count lives on the row, so its own store fetches it.
    if (collectionRef === CollectionType.MATERIAL) loadMaterialReactionsCount(collectionItemId);
    else if (collectionRef === CollectionType.TEST_PAPER) loadTestPaperReactionsCount(collectionItemId);
  }, [collectionItemId, collectionRef, collectionItem.isLoadedReactionsCount]);

  return (
    <Tooltip title={isLiked ? 'Unlike' : 'Like'}>
      <Button
        isRound
        isSubtle
        aria-pressed={isLiked}
        aria-label={isLiked ? 'Unlike' : 'Like'}
        isLoading={isToggling}
        hideLoadingIcon
        className={cn('h-8 gap-1.5 px-2.5', isLiked ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
        onClick={handleToggle}
        leftsection={<ThumbsUpIcon weight={isLiked ? 'fill' : 'bold'} className="h-4 w-4" />}
      >
        <span
          className={cn('font-mono text-xs tabular-nums', isCounting && 'animate-pulse')}
          aria-label={`${count} ${getPlural(count, 'like')}`}
        >
          {count}
        </span>
      </Button>
    </Tooltip>
  );
};
