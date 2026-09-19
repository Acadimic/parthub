import { type MeetDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { ColorType, MeetFrequency, MeetStatus } from '../enums';
import { MeetService } from '../services';
import {
  addMinutesToDate,
  getEndOfWeek,
  getObjectId,
  getStartOfDay,
  getStartOfWeek,
  getTimezone,
  getTimezoneOffset,
  setTime,
} from '../utils/helpers';
import { useSelectorStore } from './selector.store';

/** The fetches this store tracks. */
type MeetFetch = 'meets';

export interface IMeetState extends IRequestSlice<MeetFetch> {
  meetMap: Record<string, MeetDto>;

  getMeetById: (meetId: string) => MeetDto | undefined;
  getMeets: () => MeetDto[];
  getMeetsByIds: (meetIds: string[]) => MeetDto[];
  /** The meets that fall on a date, honouring each meet's recurrence. */
  getScheduledMeetsByDate: (date: Date) => MeetDto[];
  getTodaysScheduledMeets: () => MeetDto[];

  addMeets: (meets: MeetDto[]) => void;
  patchMeet: (meetId: string, fields: Partial<MeetDto>) => void;
  /** Moves a meet to another day, keeping its start and end times. */
  setMeetDate: (meetId: string, date: Date) => void;
  removeMeetById: (meetId: string) => void;
  /** Deletes a session on the server, then drops it from the store. */
  deleteMeet: (meetId: string) => Promise<void>;

  /** Adds an unsaved meet and returns it, for the caller to select. */
  createMeet: (date: Date) => MeetDto;

  loadMeets: () => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

/** How long a new session runs by default. */
const DEFAULT_DURATION_MINS = 30;

export const useMeetStore = create<IMeetState>()((set, get) => ({
  meetMap: {},
  ...createRequestSlice(['meets'], set, get),

  getMeetById: (meetId) => (meetId ? get().meetMap[meetId] : undefined),

  getMeets: () => Object.values(get().meetMap),

  getMeetsByIds: (meetIds) => {
    const { meetMap } = get();
    return meetIds.map((meetId) => meetMap[meetId]).filter((meet): meet is MeetDto => !!meet);
  },

  getScheduledMeetsByDate: (date) => {
    const dayNumber = date.getDay();
    return get()
      .getMeets()
      .filter((meet) => {
        const weekDays = meet.weekDays ?? [];
        if (meet.frequency && [MeetFrequency.DAILY, MeetFrequency.WEEKLY].includes(meet.frequency)) {
          return weekDays.includes(dayNumber);
        }
        if (!meet.startTime) return false;
        if (meet.frequency === MeetFrequency.THIS_WEEK) {
          const start = getStartOfWeek(meet.startTime);
          const end = getEndOfWeek(meet.startTime);
          return date >= start && date <= end && weekDays.includes(dayNumber);
        }
        if (meet.frequency === MeetFrequency.ONE_TIME) {
          return getStartOfDay(meet.startTime) === getStartOfDay(date);
        }
        return false;
      });
  },

  getTodaysScheduledMeets: () => get().getScheduledMeetsByDate(new Date()),

  addMeets: (meets) => {
    set((state) => ({ meetMap: { ...state.meetMap, ...keyById(meets) } }));
  },

  patchMeet: (meetId, fields) => {
    set((state) => {
      const meet = state.meetMap[meetId];
      if (!meet) return state;
      return { meetMap: { ...state.meetMap, [meetId]: { ...meet, ...fields } } };
    });
  },

  setMeetDate: (meetId, date) => {
    const meet = get().getMeetById(meetId);
    if (!meet?.startTime || !meet.endTime) return;
    get().patchMeet(meetId, {
      startTime: setTime(date, new Date(meet.startTime)).toISOString(),
      endTime: setTime(date, new Date(meet.endTime)).toISOString(),
    });
  },

  removeMeetById: (meetId) => {
    set((state) => {
      const { [meetId]: removed, ...meetMap } = state.meetMap;
      return removed ? { meetMap } : state;
    });
  },

  deleteMeet: async (meetId) => {
    await MeetService.deleteMeet(meetId);
    get().removeMeetById(meetId);
  },

  createMeet: (date) => {
    const meet: MeetDto = {
      _id: getObjectId(),
      title: 'New Session',
      description: '',
      timezone: getTimezone(),
      // The server's `timezoneOffset` is a String column; the old model typed it as a number.
      timezoneOffset: String(getTimezoneOffset()),
      startTime: new Date(date).toISOString(),
      endTime: addMinutesToDate(new Date(date), DEFAULT_DURATION_MINS).toISOString(),
      status: MeetStatus.SCHEDULED,
      standards: [],
      batches: [],
      attendees: [],
      meetingLink: '',
      meetingId: getObjectId(),
      weekDays: [0, 1, 2, 3, 4, 5, 6],
      cancelledDates: [],
      frequency: MeetFrequency.DAILY,
      color: ColorType.BLUE,
      durationMins: DEFAULT_DURATION_MINS,
      isNew: true,
    };
    get().addMeets([meet]);
    return meet;
  },

  loadMeets: () =>
    get().run('meets', async () => {
      const result = await MeetService.getMeets();
      if (result?.data) get().addMeets(result.data);
    }),

  reset: () => {
    set({ meetMap: {} });
    get().resetRequests();
  },
}));

/** The store's lookups, subscribed to its state. */
export const useMeetLookups = (): IMeetState => useMeetStore(useShallow((state) => state));

/** The selected meet, or `undefined`. Replaces `selectorStore.selectedMeet`. */
export const useSelectedMeet = (): MeetDto | undefined => {
  const selectedMeetId = useSelectorStore((state) => state.selectedMeetId);
  return useMeetStore((state) => (selectedMeetId ? state.meetMap[selectedMeetId] : undefined));
};
