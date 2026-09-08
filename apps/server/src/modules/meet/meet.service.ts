import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meet, MeetDocument } from './meet.schema';
import { MeetDto } from '@repo/shared/validations';

@Injectable()
export class MeetService {
  constructor(@InjectModel(Meet.name) private meetModel: Model<MeetDocument>) {}

  async upsert(org: Types.ObjectId, payload: MeetDto): Promise<MeetDocument> {
    const { _id } = payload;
    return this.meetModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<MeetDocument>();
  }

  async getByOrg(org: Types.ObjectId): Promise<MeetDocument[]> {
    return this.meetModel.find({ org, _deleted: { $ne: true } }).lean<MeetDocument[]>();
  }

  async getByAttendee(userId: Types.ObjectId): Promise<MeetDocument[]> {
    // `attendees` is an ObjectId array in Mongo but declared `string[]`; see FollowerService.
    return this.meetModel.find({ attendees: userId.toString(), _deleted: { $ne: true } }).lean<MeetDocument[]>();
  }

  async addAttendees(org: Types.ObjectId, meetId: string, attendeeIds: string[]): Promise<MeetDocument | null> {
    return this.meetModel
      .findOneAndUpdate({ _id: meetId, org }, { $addToSet: { attendees: { $each: attendeeIds } } }, { new: true })
      .lean<MeetDocument>();
  }

  async removeAttendees(org: Types.ObjectId, meetId: string, attendeeIds: string[]): Promise<MeetDocument | null> {
    return this.meetModel
      .findOneAndUpdate({ _id: meetId, org }, { $pull: { attendees: { $in: attendeeIds } } }, { new: true })
      .lean<MeetDocument>();
  }

  async delete(org: Types.ObjectId, meetId: string): Promise<MeetDocument | null> {
    return this.meetModel
      .findOneAndUpdate({ _id: meetId, org }, { _deleted: true }, { new: true })
      .lean<MeetDocument>();
  }

  async getMeetsByIds(ids: string[]): Promise<MeetDocument[]> {
    if (!ids.length) return [];
    return this.meetModel.find({ _id: { $in: ids }, _deleted: { $ne: true } }).lean<MeetDocument[]>();
  }
}
