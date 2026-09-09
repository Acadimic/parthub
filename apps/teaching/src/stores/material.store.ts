import { type AttachmentDto, type MaterialDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { type IMaterialInfo, type IMaterialStat, type IStandardSubjectQuery } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { DocumentType, FileExtension, LevelType, LinkType, MaterialType } from '../enums';
import { MaterialService } from '../services';
import { getObjectId, getSlug } from '../utils/helpers';
import { useSelectorStore } from './selector.store';

export type IAttachment = AttachmentDto & { isNew?: boolean };

/** The fetches this store tracks. */
type MaterialFetch = 'materialStats' | 'materials';

export interface IMaterialState extends IRequestSlice<MaterialFetch> {
  materialMap: Record<string, MaterialDto>;
  /** Roll-ups the dashboard shows; server-computed, not per-material rows. */
  materialStats: IMaterialStat[];

  getMaterialById: (materialId: string) => MaterialDto | undefined;
  getMaterials: () => MaterialDto[];
  getMaterialsByIds: (materialIds: string[]) => MaterialDto[];
  getStandardSubjectMaterials: (standardId: string, subjectId: string) => MaterialDto[];
  getMaterialsByStandardIds: (standardIds: string[]) => MaterialDto[];
  /** Duration and per-type counts across a set of materials. */
  getMaterialsStatsByMaterialIds: (materialIds: string[]) => IMaterialInfo;

  addMaterials: (materials: MaterialDto[]) => void;
  patchMaterial: (materialId: string, fields: Partial<MaterialDto>) => void;
  /** Renames a material and keeps its slug in step. */
  renameMaterial: (materialId: string, name: string) => void;
  removeMaterialById: (materialId: string) => void;
  addAttachment: (materialId: string, attachment: IAttachment) => void;
  /** Patches one attachment inside its material — an attachment has no store of its own. */
  patchAttachment: (materialId: string, attachmentId: string, fields: Partial<IAttachment>) => void;
  removeAttachment: (materialId: string, attachmentId: string) => void;
  /** Adds an empty link attachment to a material and returns it. */
  addLinkAttachment: (materialId: string) => IAttachment;

  /** Adds an unsaved material and returns it, for the caller to select. */
  createMaterial: (standardId: string, subjectId: string) => MaterialDto;

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

const isVideo = (attachment: AttachmentDto): boolean =>
  attachment.fileType === DocumentType.VIDEO ||
  (attachment.fileType === DocumentType.LINK &&
    !!attachment.linkType &&
    VIDEO_LINK_TYPES.includes(attachment.linkType));

const isDocument = (attachment: AttachmentDto): boolean =>
  attachment.fileType === DocumentType.FILE ||
  (attachment.fileType === DocumentType.LINK &&
    !!attachment.linkType &&
    !VIDEO_LINK_TYPES.includes(attachment.linkType));

/** How long a new material is assumed to take. */
const DEFAULT_DURATION_MINS = 30;

export const useMaterialStore = create<IMaterialState>()((set, get) => ({
  materialMap: {},
  materialStats: [],
  ...createRequestSlice(['materialStats', 'materials'], set, get),

  getMaterialById: (materialId) => (materialId ? get().materialMap[materialId] : undefined),

  getMaterials: () => Object.values(get().materialMap),

  getMaterialsByIds: (materialIds) => {
    const { materialMap } = get();
    return materialIds.map((id) => materialMap[id]).filter((material): material is MaterialDto => !!material);
  },

  getStandardSubjectMaterials: (standardId, subjectId) =>
    get()
      .getMaterials()
      .filter((material) => material.standard === standardId && material.subject === subjectId),

  getMaterialsByStandardIds: (standardIds) =>
    get()
      .getMaterials()
      .filter((material) => material.standard && standardIds.includes(material.standard)),

  getMaterialsStatsByMaterialIds: (materialIds) => {
    const counts: Record<MaterialType, number> = { [MaterialType.VIDEO]: 0, [MaterialType.READING]: 0 };
    let durationMins = 0;
    get()
      .getMaterialsByIds(materialIds)
      .forEach((material) => {
        durationMins += material.durationMins ?? 0;
        const attachments = material.attachments ?? [];
        const videos = attachments.filter(isVideo).length;
        const documents = attachments.filter(isDocument).length;
        counts[MaterialType.VIDEO] += videos;
        // A material with neither still counts as one reading, so it is never invisible.
        counts[MaterialType.READING] += documents || (videos ? 0 : 1);
      });
    return { durationMins, types: counts };
  },

  addMaterials: (materials) => {
    set((state) => ({ materialMap: { ...state.materialMap, ...keyById(materials) } }));
  },

  patchMaterial: (materialId, fields) => {
    set((state) => {
      const material = state.materialMap[materialId];
      if (!material) return state;
      return { materialMap: { ...state.materialMap, [materialId]: { ...material, ...fields } } };
    });
  },

  renameMaterial: (materialId, name) => {
    get().patchMaterial(materialId, { name, slug: getSlug(name) });
  },

  removeMaterialById: (materialId) => {
    set((state) => {
      const { [materialId]: removed, ...materialMap } = state.materialMap;
      return removed ? { materialMap } : state;
    });
  },

  addAttachment: (materialId, attachment) => {
    const material = get().getMaterialById(materialId);
    if (!material) return;
    get().patchMaterial(materialId, { attachments: [...(material.attachments ?? []), attachment] });
  },

  patchAttachment: (materialId, attachmentId, fields) => {
    const material = get().getMaterialById(materialId);
    if (!material) return;
    get().patchMaterial(materialId, {
      attachments: (material.attachments ?? []).map((item) =>
        item._id === attachmentId ? { ...item, ...fields } : item,
      ),
    });
  },

  removeAttachment: (materialId, attachmentId) => {
    const material = get().getMaterialById(materialId);
    if (!material) return;
    get().patchMaterial(materialId, {
      attachments: (material.attachments ?? []).filter((item) => item._id !== attachmentId),
    });
  },

  addLinkAttachment: (materialId) => {
    const attachment: IAttachment = {
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
    };
    get().addAttachment(materialId, attachment);
    return attachment;
  },

  createMaterial: (standardId, subjectId) => {
    const material: MaterialDto = {
      _id: getObjectId(),
      name: '',
      slug: '',
      standard: standardId,
      subject: subjectId,
      order: get().getStandardSubjectMaterials(standardId, subjectId).length,
      durationMins: DEFAULT_DURATION_MINS,
      level: LevelType.EASY,
      content: '',
      tag: '',
      attachments: [],
      isNew: true,
    };
    get().addMaterials([material]);
    return material;
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
export const useSelectedMaterial = (): MaterialDto | undefined => {
  const selectedMaterialId = useSelectorStore((state) => state.selectedMaterialId);
  return useMaterialStore((state) => (selectedMaterialId ? state.materialMap[selectedMaterialId] : undefined));
};
