import { Instance, types as t } from 'mobx-state-tree';
import { MaterialModel } from './models';

export const MaterialStore = t
  .model('MaterialStore', {
    materialMaps: t.map(MaterialModel),
  })
  .views((self) => ({
    get materials() {
      return Array.from(self.materialMaps.values());
    },
  }))
  .actions((self) => ({
    addMaterials: (materials: any[]) => {
      materials?.forEach((m: any) => {
        if (m?._id) self.materialMaps.set(m._id, m);
      });
    },
  }));

export type IMaterialStore = Instance<typeof MaterialStore>;
