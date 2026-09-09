import { type ClientEntityWith, type IRequestSlice, type MeetDto, createRequestSlice } from '@repo/shared';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export type IMeet = ClientEntityWith<
  MeetDto,
  | 'title'
  | 'color'
  | 'durationMins'
  | 'timezone'
  | 'timezoneOffset'
  | 'startTime'
  | 'endTime'
  | 'status'
  | 'standards'
  | 'batches'
  | 'attendees'
  | 'meetingLink'
  | 'meetingId'
  | 'weekDays'
  | 'cancelledDates'
  | 'frequency'
>;

/** The fetches this store tracks. */
type MeetFetch = 'meets';

export interface IMeetState extends IRequestSlice<MeetFetch> {
  meetMap: Record<string, IMeet>;

  getMeetById: (meetId: string) => IMeet | undefined;
  getMeets: () => IMeet[];
  getMeetsByIds: (meetIds: string[]) => IMeet[];

  addMeets: (meets: IMeet[]) => void;
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
    return meetIds.map((meetId) => meetMap[meetId]).filter((meet): meet is IMeet => !!meet);
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
