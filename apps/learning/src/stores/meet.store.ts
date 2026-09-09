import { type MeetDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/** The fetches this store tracks. */
type MeetFetch = 'meets';

export interface IMeetState extends IRequestSlice<MeetFetch> {
  meetMap: Record<string, MeetDto>;

  getMeetById: (meetId: string) => MeetDto | undefined;
  getMeets: () => MeetDto[];
  getMeetsByIds: (meetIds: string[]) => MeetDto[];

  addMeets: (meets: MeetDto[]) => void;
  removeMeetById: (meetId: string) => void;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

export const useMeetStore = create<IMeetState>()((set, get) => ({
  meetMap: {},
  ...createRequestSlice(['meets'], set, get),

  getMeetById: (meetId) => (meetId ? get().meetMap[meetId] : undefined),

  getMeets: () => Object.values(get().meetMap),

  getMeetsByIds: (meetIds) => {
    const { meetMap } = get();
    return meetIds.map((meetId) => meetMap[meetId]).filter((meet): meet is MeetDto => !!meet);
  },

  addMeets: (meets) => {
    set((state) => ({ meetMap: { ...state.meetMap, ...keyById(meets) } }));
  },

  removeMeetById: (meetId) => {
    set((state) => {
      const { [meetId]: removed, ...meetMap } = state.meetMap;
      return removed ? { meetMap } : state;
    });
  },

  reset: () => {
    set({ meetMap: {} });
    get().resetRequests();
  },
}));

/** The store's lookups, subscribed to its state. */
export const useMeetLookups = (): IMeetState => useMeetStore(useShallow((state) => state));
