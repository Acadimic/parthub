import { Instance, types as t } from 'mobx-state-tree';
import { ColorType, MeetFrequency, MeetStatus } from '../../enums';
import { addMinutesToDate, datesMinutesDiff, setTime, subtractMinutesFromDate } from '../../utils/helpers';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const Meet = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('Meet', {
      _id: t.identifier,
      title: t.string,
      description: t.optional(t.string, ''),
      color: t.enumeration('ColorType', Object.values(ColorType)),
      durationMins: t.number,
      timezone: t.string,
      timezoneOffset: t.number,
      startTime: t.string,
      endTime: t.string,
      status: t.enumeration('MeetStatus', Object.values(MeetStatus)),
      standards: t.array(t.string),
      batches: t.array(t.string),
      attendees: t.array(t.string),
      meetingLink: t.string,
      meetingId: t.string,
      weekDays: t.array(t.number),
      cancelledDates: t.array(t.string),
      isNew: t.optional(t.boolean, false),
      frequency: t.enumeration('MeetFrequency', Object.values(MeetFrequency)),
    }),
  )
  .actions((self) => ({
    setTitle: (title: string) => {
      self.title = title;
    },

    setColor: (color: ColorType) => {
      self.color = color;
    },

    setDescription: (description: string) => {
      self.description = description;
    },

    setTimezone: (timezone: string, offset: number) => {
      self.timezone = timezone;
      self.timezoneOffset = offset;
    },

    setDate: (date: Date) => {
      self.startTime = setTime(date, new Date(self.startTime)).toISOString();
      self.endTime = setTime(date, new Date(self.endTime)).toISOString();
    },

    setStartTime: (startTime: Date) => {
      const currentDate = new Date(self.startTime);
      const newDate = setTime(currentDate, startTime);
      self.startTime = newDate.toISOString();
      if (self.endTime <= self.startTime) {
        self.endTime = addMinutesToDate(new Date(self.startTime), 30).toISOString();
      }
      self.durationMins = datesMinutesDiff(new Date(self.endTime), new Date(self.startTime));
    },

    setEndTime: (endTime: Date) => {
      const currentDate = new Date(self.endTime);
      const newDate = setTime(currentDate, endTime);
      self.endTime = newDate.toISOString();
      if (self.endTime <= self.startTime) {
        self.startTime = subtractMinutesFromDate(new Date(self.endTime), 30).toISOString();
      }
      self.durationMins = datesMinutesDiff(new Date(self.endTime), new Date(self.startTime));
    },

    setStatus: (status: MeetStatus) => {
      self.status = status;
    },

    setStandards: (standards: string[]) => {
      self.standards.replace(standards);
    },

    setBatches: (batches: string[]) => {
      self.batches.replace(batches);
    },

    setAttendees: (attendees: string[]) => {
      self.attendees.replace(attendees);
    },

    setMeetingLink: (link: string) => {
      self.meetingLink = link;
    },

    setWeekDays: (days: number[]) => {
      self.weekDays.replace(days.sort());
    },

    setFrequency: (frequency: MeetFrequency) => {
      self.frequency = frequency;
      if (frequency === MeetFrequency.DAILY) {
        self.weekDays.replace([0, 1, 2, 3, 4, 5, 6]);
      } else if (frequency === MeetFrequency.ONE_TIME) {
        self.weekDays.replace([]);
      } else if (frequency === MeetFrequency.THIS_WEEK && self.weekDays.length === 0) {
        self.weekDays.replace([1, 2, 3, 4, 5]);
      } else if (frequency === MeetFrequency.WEEKLY && self.weekDays.length === 0) {
        self.weekDays.replace([1, 2, 3, 4, 5]);
      }
    },

    addCancelledDate: (date: string) => {
      self.cancelledDates.push(date);
    },

    removeCancelledDate: (date: string) => {
      const index = self.cancelledDates.findIndex((d) => new Date(d).getTime() === new Date(date).getTime());
      if (index !== -1) self.cancelledDates.splice(index, 1);
    },

    resetIsNew: () => {
      self.isNew = false;
    },
  }));

export type IMeet = Instance<typeof Meet>;
