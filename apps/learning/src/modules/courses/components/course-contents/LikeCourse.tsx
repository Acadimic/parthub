import { Spinner, Tooltip } from '@repo/ui/app';
import { CollectionType } from '@enums';
import { ThumbsUpIcon } from '@phosphor-icons/react';
import { IMaterial, ITestPaper, useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

interface IProps {
  collectionItem: IMaterial | ITestPaper;
  collectionRef: CollectionType;
}

export const LikeCourse = observer(({ collectionItem, collectionRef }: IProps) => {
  const { resourceStore } = useStores();
  const { isReacted, toggleReaction, isToggleReaction } = resourceStore;
  const collectionItemId = collectionItem._id;

  const isReactedOnItem = isReacted(collectionItemId);

  const handleLike = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    toggleReaction(collectionItemId, collectionRef);
  };

  useEffect(() => {
    if (!collectionItem.isLoadedReactionsCount) collectionItem.loadReactionsCount();
  }, [collectionItem.isLoadedReactionsCount]);

  return (
    <Tooltip title={isReactedOnItem ? 'Liked' : 'Like'}>
      <div className="rounded-full flex items-center bg-color-light border border-color-border">
        <div className="cursor-pointer h-full w-full py-1.5 px-4" onClick={handleLike}>
          <ThumbsUpIcon weight={isReactedOnItem ? 'fill' : 'bold'} className="w-5 h-5" />
        </div>
        <div className="h-6 w-px bg-color-border" />
        <div className="text-sm font-bold px-4 min-w-14 text-center">
          {isToggleReaction || collectionItem.isLoadingReactionsCount ? <Spinner /> : collectionItem.reactionsCount}
        </div>
      </div>
    </Tooltip>
  );
});
