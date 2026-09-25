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
        isSecondary
        aria-pressed={isSaved}
        isLoading={isLoadingBookmark}
        hideLoadingIcon
        className="px-3.5 py-1.5"
        onClick={() => toggleBookmark(collectionItem, collectionRef)}
        leftsection={
          <BookmarkSimpleIcon weight={isSaved ? 'fill' : 'bold'} className={cn('h-4 w-4', isSaved && 'text-warning')} />
        }
      >
        <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
        <span className="sr-only sm:hidden">{isSaved ? 'Saved' : 'Save'}</span>
      </Button>
    </Tooltip>
  );
};
