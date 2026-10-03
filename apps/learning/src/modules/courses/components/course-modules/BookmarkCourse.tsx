import { Button, Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { type CollectionType } from '@enums';
import { useBookmark } from '@hooks/bookmark.hook';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { useResourceLookups } from '@stores';

interface IProps {
  collectionItem: string;
  collectionRef: CollectionType;
}

/** Saves the item for later; filled once saved. */
export const BookmarkCourse = ({ collectionItem, collectionRef }: IProps) => {
  const { isBookmarked } = useResourceLookups();
  const { toggleBookmark, isLoadingBookmark } = useBookmark();
  const isSaved = isBookmarked(collectionItem);

  return (
    <Tooltip title={isSaved ? 'Remove bookmark' : 'Bookmark'}>
      <Button
        isRound
        isSubtle
        aria-pressed={isSaved}
        aria-label={isSaved ? 'Remove bookmark' : 'Bookmark'}
        isLoading={isLoadingBookmark}
        hideLoadingIcon
        className={cn('h-8 w-8 p-0', isSaved ? 'text-warning' : 'text-muted-foreground hover:text-foreground')}
        onClick={() => toggleBookmark(collectionItem, collectionRef)}
        leftsection={<BookmarkSimpleIcon weight={isSaved ? 'fill' : 'bold'} className="h-4 w-4" />}
      />
    </Tooltip>
  );
};
