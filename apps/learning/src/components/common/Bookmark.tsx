import { Spinner } from '@repo/ui/app';
import { type CollectionType } from '@enums';
import { useBookmark } from '@hooks/bookmark.hook';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useResourceLookups } from '@stores';

interface IProps {
  collectionItem: string;
  collectionRef: CollectionType;
  component?: React.ReactNode;
  isClickDisabled?: boolean;
  isLoading?: boolean;
}

export const Bookmark = ({ collectionItem, collectionRef, component, isClickDisabled, isLoading }: IProps) => {
  const resourceStore = useResourceLookups();
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
              className={`w-5 h-5 ${isItemBookmarked ? 'text-warning' : 'text-foreground'}`}
            />
          )}
        </div>
      )}
    </>
  );
};
