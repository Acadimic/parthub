import { useMaterialStore } from '@stores';
import { useEffect, useState } from 'react';

/**
 * Whether a material carries its body, fetching it when it does not: list routes send lessons
 * without one. Pass `null` while nothing is shown, and nothing is fetched.
 */
export const useFullMaterial = (materialId: string | null) => {
  const isFull = useMaterialStore((state) => !!materialId && state.isMaterialFull(materialId));
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    if (!materialId || isFull) return;
    setIsFailed(false);
    useMaterialStore
      .getState()
      .requestFullMaterials([materialId])
      .catch(() => setIsFailed(true));
  }, [materialId, isFull]);

  return { isFull, isFailed };
};
