import { type CollectionType } from '@enums';
import { useResourceLookups } from '@stores';
import { useState } from 'react';

export const useBookmark = () => {
  const resourceStore = useResourceLookups();
  const [isLoadingBookmark, setIsLoadingBookmark] = useState(false);

  const toggleBookmark = async (collectionItem: string, collectionRef: CollectionType) => {
    setIsLoadingBookmark(true);
    try {
      await resourceStore.toggleBookmark(collectionItem, collectionRef);
    } finally {
      setIsLoadingBookmark(false);
    }
  };

  return {
    toggleBookmark,
    isLoadingBookmark,
  };
};
