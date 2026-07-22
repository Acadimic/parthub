import { Bookmark } from '@components/common';
import { CollectionType } from '@enums';
import { useBookmark } from '@hooks/bookmark.hook';
import { observer } from 'mobx-react-lite';

interface IProps {
  collectionItem: string;
  collectionRef: CollectionType;
}

export const BookmarkCourse = observer(({ collectionItem, collectionRef }: IProps) => {
  const { toggleBookmark, isLoadingBookmark } = useBookmark();

  const handleBookmark = () => {
    toggleBookmark(collectionItem, collectionRef);
  };

  return (
    <div
      onClick={handleBookmark}
      className="cursor-pointer flex items-center space-x-2 rounded-full bg-color-light border border-color-border py-1.5 px-4"
    >
      <Bookmark
        isLoading={isLoadingBookmark}
        collectionItem={collectionItem}
        collectionRef={collectionRef}
        isClickDisabled={true}
      />
      <div className="text-sm font-medium pr-1">Bookmark</div>
    </div>
  );
});
