import { type IStandardSubjectQuery, type IMaterialInfo } from '@interfaces';
import { type Instance, flow, getRoot, types as t } from 'mobx-state-tree';
import { DocumentType, FileExtension, LevelType, LinkType, MaterialType } from '../enums';
import { MaterialService } from '../services';
import { getObjectId } from '../utils/helpers';
import { Attachment, type IAttachment, type IMaterial, Material } from './models';
import { type IStore } from './root.store';

export interface IMaterialStat {
  standard: string;
  subject: string;
  count: number;
  durationMins?: number;
  lastUpdatedAt: string;
}

export const MaterialStore = t
  .model({
    materialMaps: t.map(Material),
    materialStats: t.optional(t.array(t.frozen<IMaterialStat>()), []),
    isLoading: t.optional(t.boolean, false),
    isLoaded: t.optional(t.boolean, false),
    isLoadingMaterials: t.optional(t.boolean, false),
    isLoadedMaterials: t.optional(t.boolean, false),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    get materials(): IMaterial[] {
      return Array.from(self.materialMaps.values());
    },

    getMaterialById(materialId: string): IMaterial | undefined {
      return materialId ? self.materialMaps.get(materialId) : undefined;
    },
  }))
  .actions((self) => ({
    addMaterial: (material: IMaterial) => {
      if (!material) return;
      const materialId = material._id;
      const isMaterial = self.materialMaps.has(materialId);
      if (isMaterial) self.materialMaps.set(materialId, material);
      else self.materialMaps.put(material);
    },

    removeMaterialById: (materialId: string) => {
      self.materialMaps.delete(materialId);
    },
  }))
  .actions((self) => ({
    addMaterials: (materials: IMaterial[]) => {
      if (!materials) return;
      materials.forEach((material) => self.addMaterial(material));
    },
  }))
  .views((self) => ({
    standardSubjectMaterials(standard: string, subject: string): IMaterial[] {
      return self.materials.filter((material) => material.standard === standard && material.subject === subject);
    },

    getMaterialsByIds(ids: string[]): IMaterial[] {
      const items: IMaterial[] = [];
      ids.forEach((id) => {
        const item = self.getMaterialById(id);
        if (item) items.push(item);
      });
      return items;
    },
  }))
  .actions((self) => ({
    loadMaterialStats: flow(function* () {
      self.isLoading = true;
      const result = yield MaterialService.getMaterials();
      self.isLoading = false;
      if (!result?.data) return;
      self.isLoaded = true;
      self.materialStats = result.data;
    }),

    loadStandardSubjectMaterials: flow(function* (payload: IStandardSubjectQuery) {
      self.isLoadingMaterials = true;
      const result = yield MaterialService.getStandardSubjectMaterials(payload);
      self.isLoadingMaterials = false;
      if (!result?.data) return;
      self.isLoadedMaterials = true;
      self.addMaterials(result?.data);
    }),

    loadStandardsMaterials: flow(function* (standards: string[]) {
      self.isLoadingMaterials = true;
      const result = yield MaterialService.getStandardsMaterials(standards);
      self.isLoadingMaterials = false;
      if (!result?.data) return;
      self.isLoadedMaterials = true;
      self.addMaterials(result?.data);
    }),

    createMaterial: (standard: string, subject: string) => {
      const order = self.standardSubjectMaterials(standard, subject).length;
      const material = Material.create({
        _id: getObjectId(),
        name: '',
        slug: '',
        order,
        isNew: true,
        standard,
        subject,
        durationMins: 30,
        level: LevelType.EASY,
        ...self.rootStore.selectorStore.selectedData,
      });
      self.addMaterial(material);
      self.rootStore.selectorStore.setSelectedMaterialId(material._id);
      return material;
    },

    addLinkAttachment: (): IAttachment | null => {
      const selectedMaterial = self.rootStore.selectorStore.selectedMaterial;
      if (!selectedMaterial) return null;
      const attachment = Attachment.create({
        _id: getObjectId(),
        fileName: '',
        url: '',
        documentType: DocumentType.LINK,
        fileType: DocumentType.LINK,
        fileExtension: FileExtension.OTHER,
        linkType: LinkType.YOUTUBE,
        reference: '',
        tag: '',
        isUploaded: false,
        isNew: true,
      });
      selectedMaterial.addAttachment(attachment);
      return attachment;
    },
  }))
  .views((self) => ({
    materialsByStandardIds(standardIds: string[]): IMaterial[] {
      return self.materials.filter((material) => standardIds.includes(material.standard));
    },

    getMaterialsStatsByMaterialIds: (materialIds: string[]): IMaterialInfo => {
      const materials = self.getMaterialsByIds(materialIds);
      const materialCountMap: Record<MaterialType, number> = {
        [MaterialType.VIDEO]: 0,
        [MaterialType.READING]: 0,
      };
      let durationMins = 0;
      materials.forEach((material) => {
        durationMins += material.durationMins;
        const videos = material.attachments.filter(
          (attachment) =>
            attachment.fileType === DocumentType.VIDEO ||
            (attachment.fileType === DocumentType.LINK &&
              attachment.linkType &&
              [(LinkType.YOUTUBE, LinkType.VIDEO)].includes(attachment.linkType)),
        ).length;
        const documents = material.attachments.filter(
          (attachment) =>
            attachment.fileType === DocumentType.FILE ||
            (attachment.fileType === DocumentType.LINK &&
              attachment.linkType &&
              ![(LinkType.YOUTUBE, LinkType.VIDEO)].includes(attachment.linkType)),
        ).length;
        materialCountMap[MaterialType.VIDEO] += videos;
        materialCountMap[MaterialType.READING] += documents ? documents : videos ? 0 : 1;
      });
      return { durationMins, types: materialCountMap };
    },
  }));

export type IMaterialStore = Instance<typeof MaterialStore>;
