import { type CollectionType } from '@enums';
import { useStores } from '@stores';
import { useState } from 'react';

export const useBookmark = () => {
  const { resourceStore } = useStores();
  const [isLoadingBookmark, setIsLoadingBookmark] = useState(false);

  const toggleBookmark = async (collectionItem: string, collectionRef: CollectionType) => {
    setIsLoadingBookmark(true);
    await resourceStore.toggleBookmark(collectionItem, collectionRef);
    setIsLoadingBookmark(false);
  };

  return {
    toggleBookmark,
    isLoadingBookmark,
  };
};
