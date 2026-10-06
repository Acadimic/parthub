import { type AttachmentDto, type MaterialDto } from '@repo/shared/contracts';
import {
  type IRequestSlice,
  MAX_MATERIAL_IDS,
  createEmptyRichText,
  createRequestSlice,
  getMaterialsInfo,
} from '@repo/shared/utils';
import { type IMaterialInfo, type IMaterialStat, type IStandardSubjectQuery } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { DocumentType, FileExtension, LevelType, LinkType } from '../enums';
import { MaterialService } from '../services';
import { getObjectId, getSlug } from '../utils/helpers';
import { useSelectorStore } from './selector.store';

export type IAttachment = AttachmentDto & { isNew?: boolean };

/** The fetches this store tracks. */
type MaterialFetch = 'materialStats' | 'materials';

export interface IMaterialState extends IRequestSlice<MaterialFetch> {
  materialMap: Record<string, MaterialDto>;
  /**
   * Per standard/subject roll-ups of `materialMap`, recomputed on every write to it.
   *
   * Stored rather than derived on read: a getter that built fresh objects each call could never
   * satisfy a `useShallow` selector, and the list page re-rendered until React gave up.
   */
  materialStats: IMaterialStat[];
  /**
   * Ids already read in full. Kept apart from `content`: a lesson stored without a body reads back
   * without one, and must still count as loaded rather than waiting on a fetch forever.
   */
  fullMaterialIds: Record<string, true>;

  getMaterialById: (materialId: string) => MaterialDto | undefined;
  getMaterials: () => MaterialDto[];
  getMaterialsByIds: (materialIds: string[]) => MaterialDto[];
  getStandardSubjectMaterials: (standardId: string, subjectId: string) => MaterialDto[];
  getMaterialsByStandardIds: (standardIds: string[]) => MaterialDto[];
  /** Duration and per-type counts across a set of materials. */
  getMaterialsStatsByMaterialIds: (materialIds: string[]) => IMaterialInfo;
  /**
   * One row per standard-and-subject pair, derived from the materials currently held. Nothing on
   * the server computes this — a saved or deleted material changes the roll-up with no second fetch.
   */
  getMaterialStats: () => IMaterialStat[];
  /**
   * Whether the row carries its body. List routes send lessons without `content`; a read by ids
   * or a save's response sends it, and a draft made here has it from the start.
   */
  isMaterialFull: (materialId: string) => boolean;

  /**
   * Merges rows into the ones held, so a list row without a body never drops one already loaded.
   * `isNew` is the one field taken as sent: the server never returns it, so a saved row clears it.
   */
  addMaterials: (materials: MaterialDto[]) => void;
  patchMaterial: (materialId: string, fields: Partial<MaterialDto>) => void;
  /** Renames a material and keeps its slug in step. */
  renameMaterial: (materialId: string, name: string) => void;
  removeMaterialById: (materialId: string) => void;
  addAttachment: (materialId: string, attachment: IAttachment) => void;
  /** Patches one attachment inside its material — an attachment has no store of its own. */
  /** Attachments are addressed by their `key` — see `AttachmentDto.key` for why. */
  patchAttachment: (materialId: string, key: string, fields: Partial<IAttachment>) => void;
  removeAttachment: (materialId: string, key: string) => void;
  /** Adds an empty link attachment to a material and returns it. */
  /** Appends a blank link attachment and returns it, for the caller to select. */
  addLinkAttachment: (materialId: string) => IAttachment;

  /** Adds an unsaved material and returns it, for the caller to select. */
  createMaterial: (standardId: string, subjectId: string) => MaterialDto;

  /**
   * Removes materials for good, then drops them from the store. There is no delete route: a row
   * goes by upserting it with `_deleted`, which every read then filters out. Rejects if any upsert
   * fails, so the caller can report it and leave the rows visible.
   */
  deleteMaterials: (materialIds: string[]) => Promise<void>;

  /**
   * Fetches the bodies of the given materials that are not full yet. Calls made in the same tick
   * share one `material/ids` request, so a screen showing ten lessons asks once.
   */
  requestFullMaterials: (materialIds: string[]) => Promise<void>;
  loadMaterialStats: () => Promise<void>;
  loadStandardSubjectMaterials: (query: IStandardSubjectQuery) => Promise<void>;
  loadStandardsMaterials: (standardIds: string[]) => Promise<void>;
  reset: () => void;
}

/** How long a new material is assumed to take. */
const DEFAULT_DURATION_MINS = 30;

/**
 * Rolls materials up to one row per standard-and-subject pair.
 *
 * Pure, and exported so it can be read and tested without a store. `GET material/all` returns the
 * materials themselves, not roll-ups — treating that response as `IMaterialStat[]` is what put one
 * duplicate row per material on the list screen, each with a blank count and an unparseable date.
 *
 * A material still only on the client contributes nothing: an abandoned draft is not content, and
 * counting it would make the list disagree with what a reload shows.
 */
export const toMaterialStats = (materials: MaterialDto[]): IMaterialStat[] => {
  const statsByPair = new Map<string, IMaterialStat>();
  for (const material of materials) {
    const { standard, subject } = material;
    if (material.isNew || !standard || !subject) continue;
    const key = `${standard}|${subject}`;
    const stat = statsByPair.get(key) ?? { standard, subject, count: 0, durationMins: 0, lastUpdatedAt: '' };
    stat.count += 1;
    stat.durationMins = (stat.durationMins ?? 0) + (material.durationMins ?? 0);
    // A row that was saved once and never edited carries no `updatedAt`, so its creation time is
    // the last thing that happened to it. Without the fallback the pair reads as never updated.
    const updatedAt = material.updatedAt ?? material.createdAt ?? '';
    if (updatedAt > stat.lastUpdatedAt) stat.lastUpdatedAt = updatedAt;
    statsByPair.set(key, stat);
  }
  return Array.from(statsByPair.values());
};

/**
 * The order a new material takes within its pair.
 *
 * One past the highest in use, not the count: `{ standard, subject, chapter, order }` is unique on
 * the server, and a draft that was abandoned leaves the count pointing at an order a saved row
 * already holds, so the next save collides.
 */
const getNextMaterialOrder = (materials: MaterialDto[]): number =>
  materials.reduce((max, material) => Math.max(max, material.order ?? 0), 0) + 1;

/** A map write and the roll-ups that follow from it, so the two can never drift apart. */
const withStats = (materialMap: Record<string, MaterialDto>) => ({
  materialMap,
  materialStats: toMaterialStats(Object.values(materialMap)),
});

/** The fetch each material id is waiting on. */
const fullMaterialRequests = new Map<string, Promise<void>>();
/** The batch still collecting ids in this tick; it is sent, and closed, on the next microtask. */
let openBatch: { ids: string[]; request: Promise<void> } | null = null;
const toIdSet = (ids: string[]): Record<string, true> => Object.fromEntries(ids.map((id) => [id, true]));

/** Bumped by `reset`, so a batch still in flight from before it never writes into the new state. */
let storeGeneration = 0;

export const useMaterialStore = create<IMaterialState>()((set, get) => ({
  materialMap: {},
  materialStats: [],
  fullMaterialIds: {},
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

  getMaterialsStatsByMaterialIds: (materialIds) => getMaterialsInfo(get().getMaterialsByIds(materialIds)),

  getMaterialStats: () => get().materialStats,

  isMaterialFull: (materialId) => {
    const material = get().materialMap[materialId];
    return !!material && (!!material.isNew || material.content !== undefined || !!get().fullMaterialIds[materialId]);
  },

  addMaterials: (materials) => {
    set((state) => {
      const materialMap = { ...state.materialMap };
      for (const material of materials) {
        materialMap[material._id] = { ...materialMap[material._id], ...material, isNew: material.isNew };
      }
      return withStats(materialMap);
    });
  },

  patchMaterial: (materialId, fields) => {
    set((state) => {
      const material = state.materialMap[materialId];
      if (!material) return state;
      return withStats({ ...state.materialMap, [materialId]: { ...material, ...fields } });
    });
  },

  renameMaterial: (materialId, name) => {
    get().patchMaterial(materialId, { name, slug: getSlug(name) });
  },

  removeMaterialById: (materialId) => {
    set((state) => {
      const { [materialId]: removed, ...materialMap } = state.materialMap;
      return removed ? withStats(materialMap) : state;
    });
  },

  addAttachment: (materialId, attachment) => {
    const material = get().getMaterialById(materialId);
    if (!material) return;
    get().patchMaterial(materialId, { attachments: [...(material.attachments ?? []), attachment] });
  },

  patchAttachment: (materialId, key, fields) => {
    const material = get().getMaterialById(materialId);
    if (!material) return;
    get().patchMaterial(materialId, {
      attachments: (material.attachments ?? []).map((item) => (item.key === key ? { ...item, ...fields } : item)),
    });
  },

  removeAttachment: (materialId, key) => {
    const material = get().getMaterialById(materialId);
    if (!material) return;
    get().patchMaterial(materialId, {
      attachments: (material.attachments ?? []).filter((item) => item.key !== key),
    });
  },

  addLinkAttachment: (materialId) => {
    const attachment: IAttachment = {
      key: getObjectId(),
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
      order: getNextMaterialOrder(get().getStandardSubjectMaterials(standardId, subjectId)),
      durationMins: DEFAULT_DURATION_MINS,
      level: LevelType.EASY,
      content: createEmptyRichText(),
      tag: '',
      attachments: [],
      isNew: true,
    };
    get().addMaterials([material]);
    return material;
  },

  deleteMaterials: async (materialIds) => {
    const materials = get().getMaterialsByIds(materialIds);
    await Promise.all(materials.map((material) => MaterialService.upsertMaterial({ ...material, _deleted: true })));
    materials.forEach((material) => get().removeMaterialById(material._id));
  },

  requestFullMaterials: (materialIds) => {
    const missing = materialIds.filter((id) => !get().isMaterialFull(id) && !fullMaterialRequests.has(id));
    if (missing.length) {
      if (!openBatch) {
        const batch: { ids: string[]; request: Promise<void> } = { ids: [], request: Promise.resolve() };
        const generation = storeGeneration;
        batch.request = Promise.resolve().then(async () => {
          openBatch = null;
          try {
            for (let index = 0; index < batch.ids.length; index += MAX_MATERIAL_IDS) {
              const ids = batch.ids.slice(index, index + MAX_MATERIAL_IDS);
              const result = await MaterialService.getMaterialsByIds(ids);
              if (generation !== storeGeneration) return;
              if (result?.data) get().addMaterials(result.data);
              // Every id asked for counts as read, including one with no body or one since deleted.
              set((state) => ({
                fullMaterialIds: { ...state.fullMaterialIds, ...toIdSet(ids) },
              }));
            }
          } finally {
            batch.ids.forEach((id) => fullMaterialRequests.delete(id));
          }
        });
        openBatch = batch;
      }
      const { ids, request } = openBatch;
      ids.push(...missing);
      missing.forEach((id) => fullMaterialRequests.set(id, request));
    }
    const pending = materialIds.map((id) => fullMaterialRequests.get(id)).filter((request) => !!request);
    return Promise.all(new Set(pending)).then(() => undefined);
  },

  loadMaterialStats: () =>
    get().run('materialStats', async () => {
      const result = await MaterialService.getMaterials();
      if (result?.data) get().addMaterials(result.data);
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
    storeGeneration += 1;
    openBatch = null;
    fullMaterialRequests.clear();
    set({ materialMap: {}, materialStats: [], fullMaterialIds: {} });
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
