import { FollowerDto } from '@parthhub/shared/validations';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follower, FollowerDocument } from './follower.schema';

@Injectable()
export class FollowerService {
  constructor(@InjectModel(Follower.name) private followerModel: Model<FollowerDocument>) {}

  async upsert(userId: Types.ObjectId, payload: FollowerDto): Promise<FollowerDocument> {
    return this.followerModel
      .findOneAndUpdate(
        { follower: userId, following: payload.following },
        { ...payload, follower: userId },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<FollowerDocument>();
  }

  async getFollowers(userId: Types.ObjectId): Promise<FollowerDocument[]> {
    return this.followerModel.find({ following: userId, _deleted: { $ne: true } }).lean<FollowerDocument[]>();
  }

  async getFollowings(userId: Types.ObjectId): Promise<FollowerDocument[]> {
    return this.followerModel.find({ follower: userId, _deleted: { $ne: true } }).lean<FollowerDocument[]>();
  }

  async getFollowersCount(userId: Types.ObjectId): Promise<number> {
    return this.followerModel.countDocuments({
      following: userId,
      _deleted: { $ne: true },
    });
  }
}
