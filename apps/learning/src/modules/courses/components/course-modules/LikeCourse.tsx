import { Spinner, Tooltip } from '@repo/ui/app';
import { CollectionType } from '@enums';
import { ThumbsUpIcon } from '@phosphor-icons/react';
import { type IMaterial, type ITestPaper, useMaterialLookups, useResourceLookups, useTestPaperLookups } from '@stores';
import { useEffect } from 'react';

interface IProps {
  collectionItem: IMaterial | ITestPaper;
  collectionRef: CollectionType;
}

export const LikeCourse = ({ collectionItem, collectionRef }: IProps) => {
  const resourceStore = useResourceLookups();
  const { loadReactionsCount: loadMaterialReactionsCount } = useMaterialLookups();
  const { loadReactionsCount: loadTestPaperReactionsCount } = useTestPaperLookups();
  const { isReacted, toggleReaction } = resourceStore;
  const isToggleReaction = resourceStore.isLoading('toggleReaction');
  const collectionItemId = collectionItem._id;

  const isReactedOnItem = isReacted(collectionItemId);

  const handleLike = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    toggleReaction(collectionItemId, collectionRef);
  };

  useEffect(() => {
    if (collectionItem.isLoadedReactionsCount) return;
    // The count lives on the row, so its own store fetches it.
    if (collectionRef === CollectionType.MATERIAL) loadMaterialReactionsCount(collectionItemId);
    else if (collectionRef === CollectionType.TEST_PAPER) loadTestPaperReactionsCount(collectionItemId);
  }, [collectionItemId, collectionRef, collectionItem.isLoadedReactionsCount]);

  return (
    <Tooltip title={isReactedOnItem ? 'Liked' : 'Like'}>
      <div className="rounded-full flex items-center bg-accent border border-border">
        <div className="cursor-pointer h-full w-full py-1.5 px-4" onClick={handleLike}>
          <ThumbsUpIcon weight={isReactedOnItem ? 'fill' : 'bold'} className="w-5 h-5" />
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="text-sm font-bold px-4 min-w-14 text-center">
          {isToggleReaction || collectionItem.isLoadingReactionsCount ? <Spinner /> : collectionItem.reactionsCount}
        </div>
      </div>
    </Tooltip>
  );
};
