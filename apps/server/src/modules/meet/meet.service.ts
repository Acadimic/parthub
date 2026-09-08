import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meet, MeetDocument } from './meet.schema';
import { MeetDto } from '@parthhub/shared/validations';

@Injectable()
export class MeetService {
  constructor(@InjectModel(Meet.name) private meetModel: Model<MeetDocument>) {}

  async upsert(userId: Types.ObjectId, org: Types.ObjectId, payload: MeetDto): Promise<MeetDocument> {
    const { _id } = payload;
    return this.meetModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { org, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<MeetDocument>();
  }

  async getByOrg(org: Types.ObjectId): Promise<MeetDocument[]> {
    return this.meetModel.find({ org, isDeleted: { $ne: true } }).lean<MeetDocument[]>();
  }

  async getByAttendee(userId: Types.ObjectId): Promise<MeetDocument[]> {
    return this.meetModel.find({ attendees: userId, isDeleted: { $ne: true } }).lean<MeetDocument[]>();
  }

  async addAttendees(meetId: string, attendeeIds: string[]): Promise<MeetDocument> {
    return this.meetModel
      .findOneAndUpdate({ _id: meetId }, { $addToSet: { attendees: { $each: attendeeIds } } }, { new: true })
      .lean<MeetDocument>();
  }

  async removeAttendees(meetId: string, attendeeIds: string[]): Promise<MeetDocument> {
    return this.meetModel
      .findOneAndUpdate({ _id: meetId }, { $pull: { attendees: { $in: attendeeIds } } }, { new: true })
      .lean<MeetDocument>();
  }

  async delete(meetId: string): Promise<MeetDocument> {
    return this.meetModel.findOneAndUpdate({ _id: meetId }, { isDeleted: true }, { new: true }).lean<MeetDocument>();
  }

  async getMeetsByIds(ids: string[]): Promise<MeetDocument[]> {
    if (!ids.length) return [];
    return this.meetModel.find({ _id: { $in: ids }, isDeleted: { $ne: true } }).lean<MeetDocument[]>();
  }
}
