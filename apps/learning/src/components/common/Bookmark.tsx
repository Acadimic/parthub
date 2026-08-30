import { Spinner } from '@components/app';
import { CollectionType } from '@enums';
import { useBookmark } from '@hooks/bookmark.hook';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  collectionItem: string;
  collectionRef: CollectionType;
  component?: React.ReactNode;
  isClickDisabled?: boolean;
  isLoading?: boolean;
}

export const Bookmark = observer(({ collectionItem, collectionRef, component, isClickDisabled, isLoading }: IProps) => {
  const { resourceStore } = useStores();
  const { isBookmarked } = resourceStore;
  const { toggleBookmark, isLoadingBookmark } = useBookmark();

  const isItemBookmarked = isBookmarked(collectionItem);

  const handleBookmark = () => {
    if (isClickDisabled) return;
    toggleBookmark(collectionItem, collectionRef);
  };

  return (
    <>
      {isLoadingBookmark || isLoading ? (
        <Spinner />
      ) : (
        <div className="cursor-pointer flex items-center justify-center space-x-2" onClick={handleBookmark}>
          {component ? (
            component
          ) : (
            <BookmarkSimpleIcon
              weight={isItemBookmarked ? 'fill' : 'regular'}
              className={`w-5 h-5 ${isItemBookmarked ? 'text-yellow-primary' : 'text-color-primary'}`}
            />
          )}
        </div>
      )}
    </>
  );
});
