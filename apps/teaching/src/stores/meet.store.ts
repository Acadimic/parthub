import { type Instance, flow, getRoot, types as t } from 'mobx-state-tree';
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
} from '../utils/helpers';
import { type IMeet, Meet } from './models';
import { type IStore } from './root.store';

export const MeetStore = t
  .model({
    meetMaps: t.map(Meet),
    isLoadingMeets: t.optional(t.boolean, false),
    isLoadedMeets: t.optional(t.boolean, false),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    getMeetById(meetId: string): IMeet | undefined {
      return meetId ? self.meetMaps.get(meetId) : undefined;
    },

    get meets(): IMeet[] {
      return Array.from(self.meetMaps.values());
    },
  }))
  .views((self) => ({
    getMeetsByIds(ids: string[]): IMeet[] {
      const items: IMeet[] = [];
      ids.forEach((id) => {
        const item = self.getMeetById(id);
        if (item) items.push(item);
      });
      return items;
    },
  }))
  .actions((self) => ({
    addMeet: (obj: IMeet) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.meetMaps.has(objId);
      if (isObj) self.meetMaps.set(objId, obj);
      else self.meetMaps.put(obj);
    },

    removeMeetById: (id: string) => {
      self.meetMaps.delete(id);
    },
  }))
  .actions((self) => ({
    addMeets: (objects: IMeet[]) => {
      objects.forEach((obj) => self.addMeet(obj));
    },
  }))
  .actions((self) => ({
    loadMeets: flow(function* () {
      self.isLoadedMeets = true;
      const result = yield MeetService.getMeets();
      console.log('loadMeets result:', result.data);
      if (result?.data) self.addMeets(result.data);
      console.log('MeetStore loaded meets:', self.meets.length);
      self.isLoadedMeets = false;
      self.isLoadedMeets = true;
    }),
  }))
  .actions((self) => ({
    createMeet: (date: Date) => {
      const durationMins = 30;
      const meet = Meet.create({
        _id: getObjectId(),
        title: 'New Session',
        description: '',
        timezone: getTimezone(),
        timezoneOffset: getTimezoneOffset(),
        startTime: new Date(date).toISOString(),
        endTime: addMinutesToDate(new Date(date), durationMins).toISOString(),
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
        isNew: true,
        durationMins,
        ...self.rootStore.selectorStore.selectedData,
      });
      self.addMeet(meet);
      self.rootStore.selectorStore.setSelectedMeetId(meet._id);
      return meet;
    },
  }))
  .views((self) => ({
    getScheduledMeetByDate(date: Date): IMeet[] {
      const dayNumber = date.getDay();
      const filteredMeets: IMeet[] = [];
      self.meets.forEach((meet) => {
        if ([MeetFrequency.DAILY, MeetFrequency.WEEKLY].includes(meet.frequency)) {
          if (meet.weekDays.includes(dayNumber)) {
            filteredMeets.push(meet);
          }
        } else if (meet.frequency === MeetFrequency.THIS_WEEK) {
          const startWeekDate = getStartOfWeek(meet.startTime);
          const endWeekDate = getEndOfWeek(meet.startTime);
          if (date >= startWeekDate && date <= endWeekDate && meet.weekDays.includes(dayNumber)) {
            filteredMeets.push(meet);
          }
        } else if (meet.frequency === MeetFrequency.ONE_TIME && getStartOfDay(meet.startTime) === getStartOfDay(date)) {
          filteredMeets.push(meet);
        }
      });
      return filteredMeets;
    },
  }))
  .views((self) => ({
    get todaysScheduledMeets(): IMeet[] {
      const today = new Date();
      return self.getScheduledMeetByDate(today);
    },
  }));

export type IMeetStore = Instance<typeof MeetStore>;
