import {
  type AttachmentDto,
  type ClientEntityWith,
  type IRequestSlice,
  type MaterialDto,
  createRequestSlice,
} from '@repo/shared';
import { type IMaterialInfo, type IMaterialStat, type IStandardSubjectQuery } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { DocumentType, LinkType, MaterialType } from '../enums';
import { MaterialService, ReactionService } from '../services';
import { useSelectorStore } from './selector.store';

export type IMaterial = ClientEntityWith<
  MaterialDto,
  'name' | 'slug' | 'standard' | 'subject' | 'order' | 'content' | 'durationMins' | 'level' | 'attachments' | 'tag'
> &
  // Client-only, and stripped from every request by `CLIENT_ONLY_KEYS`: a per-row reaction count
  // and whether it has been fetched.
  { reactionsCount?: number; isLoadedReactionsCount?: boolean; isLoadingReactionsCount?: boolean };
export type IAttachment = AttachmentDto;

/** The fetches this store tracks. */
type MaterialFetch = 'materialStats' | 'materials';

export interface IMaterialState extends IRequestSlice<MaterialFetch> {
  materialMap: Record<string, IMaterial>;
  /** Roll-ups the dashboard shows; server-computed, not per-material rows. */
  materialStats: IMaterialStat[];

  getMaterialById: (materialId: string) => IMaterial | undefined;
  getMaterials: () => IMaterial[];
  getMaterialsByIds: (materialIds: string[]) => IMaterial[];
  getStandardSubjectMaterials: (standardId: string, subjectId: string) => IMaterial[];
  getMaterialsByStandardIds: (standardIds: string[]) => IMaterial[];
  /** The attachments that play as video, rather than opening as a document. */
  getMaterialVideos: (material: IMaterial) => IAttachment[];
  getMaterialDocuments: (material: IMaterial) => IAttachment[];
  /** Duration and per-type counts across a set of materials. */
  getMaterialsInfoMaterialIds: (materialIds: string[]) => IMaterialInfo;

  addMaterials: (materials: IMaterial[]) => void;
  patchMaterial: (materialId: string, fields: Partial<IMaterial>) => void;
  removeMaterialById: (materialId: string) => void;

  /** Fetches a material's reaction count into its row. Was `loadReactionsCount` on the model. */
  loadReactionsCount: (materialId: string) => Promise<void>;
  loadMaterialStats: () => Promise<void>;
  loadStandardSubjectMaterials: (query: IStandardSubjectQuery) => Promise<void>;
  loadStandardsMaterials: (standardIds: string[]) => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

/** A link attachment that plays as video rather than opening as a document. */
const VIDEO_LINK_TYPES: LinkType[] = [LinkType.YOUTUBE, LinkType.VIDEO];

export const useMaterialStore = create<IMaterialState>()((set, get) => ({
  materialMap: {},
  materialStats: [],
  ...createRequestSlice(['materialStats', 'materials'], set, get),

  getMaterialById: (materialId) => (materialId ? get().materialMap[materialId] : undefined),

  getMaterials: () => Object.values(get().materialMap),

  getMaterialsByIds: (materialIds) => {
    const { materialMap } = get();
    return materialIds.map((id) => materialMap[id]).filter((material): material is IMaterial => !!material);
  },

  getStandardSubjectMaterials: (standardId, subjectId) =>
    get()
      .getMaterials()
      .filter((material) => material.standard === standardId && material.subject === subjectId),

  getMaterialsByStandardIds: (standardIds) =>
    get()
      .getMaterials()
      .filter((material) => standardIds.includes(material.standard)),

  getMaterialVideos: (material) =>
    material.attachments.filter(
      (attachment) =>
        attachment.documentType === DocumentType.VIDEO ||
        (attachment.documentType === DocumentType.LINK &&
          !!attachment.linkType &&
          VIDEO_LINK_TYPES.includes(attachment.linkType)),
    ),

  getMaterialDocuments: (material) =>
    material.attachments.filter(
      (attachment) =>
        attachment.fileType === DocumentType.FILE ||
        (attachment.fileType === DocumentType.LINK &&
          !!attachment.linkType &&
          !VIDEO_LINK_TYPES.includes(attachment.linkType)),
    ),

  getMaterialsInfoMaterialIds: (materialIds) => {
    const counts: Record<MaterialType, number> = { [MaterialType.VIDEO]: 0, [MaterialType.READING]: 0 };
    let durationMins = 0;
    get()
      .getMaterialsByIds(materialIds)
      .forEach((material) => {
        durationMins += material.durationMins;
        const videos = get().getMaterialVideos(material).length;
        const documents = get().getMaterialDocuments(material).length;
        counts[MaterialType.VIDEO] += videos;
        // A material with neither still counts as one reading, so it is never invisible.
        counts[MaterialType.READING] += documents || (videos ? 0 : 1);
      });
    return { durationMins, types: counts };
  },

  addMaterials: (materials) => {
    set((state) => ({ materialMap: { ...state.materialMap, ...keyById(materials) } }));
  },

  removeMaterialById: (materialId) => {
    set((state) => {
      const { [materialId]: removed, ...materialMap } = state.materialMap;
      return removed ? { materialMap } : state;
    });
  },

  patchMaterial: (materialId, fields) => {
    set((state) => {
      const material = state.materialMap[materialId];
      if (!material) return state;
      return { materialMap: { ...state.materialMap, [materialId]: { ...material, ...fields } } };
    });
  },

  loadReactionsCount: async (materialId) => {
    if (!materialId) return;
    get().patchMaterial(materialId, { isLoadingReactionsCount: true });
    const result = await ReactionService.getReactionsCount(materialId);
    get().patchMaterial(materialId, {
      reactionsCount: result?.data ?? 0,
      isLoadedReactionsCount: true,
      isLoadingReactionsCount: false,
    });
  },

  loadMaterialStats: () =>
    get().run('materialStats', async () => {
      const result = await MaterialService.getMaterials();
      if (result?.data) set({ materialStats: result.data });
    }),

  loadStandardSubjectMaterials: (query) =>
    get().run('materials', async () => {
      const result = await MaterialService.getStandardSubjectMaterials(query);
      if (result?.data) get().addMaterials(result.data);
    }),

  loadStandardsMaterials: (standardIds) =>
    get().run('materials', async () => {
      const result = await MaterialService.getStandardsMaterials(standardIds);
      if (result?.data) get().addMaterials(result.data);
    }),

  reset: () => {
    set({ materialMap: {}, materialStats: [] });
    get().resetRequests();
  },
}));

/** The store's lookups, subscribed to its state. */
export const useMaterialLookups = (): IMaterialState => useMaterialStore(useShallow((state) => state));

/** The selected material, or `undefined`. Replaces `selectorStore.selectedMaterial`. */
export const useSelectedMaterial = (): IMaterial | undefined => {
  const selectedMaterialId = useSelectorStore((state) => state.selectedMaterialId);
  return useMaterialStore((state) => (selectedMaterialId ? state.materialMap[selectedMaterialId] : undefined));
};
