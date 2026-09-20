import { type MaterialDto } from '@repo/shared/contracts';
import { repairRichText } from '@repo/shared/utils';
import { MaterialService } from '@services';
import { useMaterialStore } from '@stores';
import { reportError, successToast } from '@utils/helpers';
import { useCallback, useState } from 'react';

/**
 * Fixes equations that arrived broken from an AI import — commands whose backslash became a
 * control character, bare percent signs, equations left in prose — and saves the material.
 */
const repairMaterial = async (material: MaterialDto): Promise<number> => {
  if (!material.content) return 0;
  const { value, repairs } = repairRichText(material.content);
  if (!repairs) return 0;
  const result = await MaterialService.upsertMaterial({ ...material, content: value });
  if (result?.data) useMaterialStore.getState().addMaterials([result.data]);
  return repairs;
};

const places = (count: number) => `${count} ${count === 1 ? 'place' : 'places'}`;

/** The repair actions a material page offers: one content, or every content it shows. */
export const useMaterialRepair = (materials: MaterialDto[]) => {
  const [isRepairing, setIsRepairing] = useState(false);

  // Stable: it is handed to memoised content cards.
  const onRepairMaterial = useCallback(async (material: MaterialDto) => {
    try {
      const repairs = await repairMaterial(material);
      successToast({
        message: repairs ? `Repaired ${places(repairs)} in ${material.name}.` : 'Nothing to repair in this content.',
      });
    } catch (error) {
      reportError(error, 'Could not repair the content.');
    }
  }, []);

  const onRepairAll = async () => {
    setIsRepairing(true);
    try {
      let total = 0;
      let touched = 0;
      for (const material of materials) {
        const repairs = await repairMaterial(material);
        total += repairs;
        if (repairs) touched += 1;
      }
      successToast({
        message: total
          ? `Repaired ${places(total)} across ${touched} ${touched === 1 ? 'content' : 'contents'}.`
          : 'No broken equations found.',
      });
    } catch (error) {
      reportError(error, 'Could not repair the contents.');
    } finally {
      setIsRepairing(false);
    }
  };

  return { onRepairMaterial, onRepairAll, isRepairing };
};
