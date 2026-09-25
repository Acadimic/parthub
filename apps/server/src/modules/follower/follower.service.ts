import { FollowerDto } from '@repo/shared/validations';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follower, FollowerDocument } from './follower.schema';

@Injectable()
export class FollowerService {
  constructor(@InjectModel(Follower.name) private followerModel: Model<FollowerDocument>) {}

  // `follower` and `following` are stored as ObjectId but declared `string` on the schema class
  // and the DTO, so ids cross this boundary as strings and Mongoose casts them on the path.
  // Mongoose 9's query filters enforce the declared type; 8's did not.
  async upsert(userId: Types.ObjectId, payload: FollowerDto): Promise<FollowerDocument> {
    const follower = userId.toString();
    return this.followerModel
      .findOneAndUpdate(
        { follower, following: payload.following },
        { ...payload, follower },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<FollowerDocument>();
  }

  async getFollowers(userId: Types.ObjectId): Promise<FollowerDocument[]> {
    return this.followerModel
      .find({ following: userId.toString(), _deleted: { $ne: true } })
      .lean<FollowerDocument[]>();
  }

  async getFollowings(userId: Types.ObjectId): Promise<FollowerDocument[]> {
    return this.followerModel.find({ follower: userId.toString(), _deleted: { $ne: true } }).lean<FollowerDocument[]>();
  }

  /** A malformed id is nobody, and nobody has followers — answered rather than thrown as a cast error. */
  async getFollowersCount(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) return 0;
    return this.followerModel.countDocuments({
      following: userId,
      _deleted: { $ne: true },
    });
  }
}
