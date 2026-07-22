import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reaction, ReactionDocument } from './reaction.schema';
import { UpsertReactionDto } from './dto/upsert-reaction.dto';

@Injectable()
export class ReactionService {
  constructor(@InjectModel(Reaction.name) private reactionModel: Model<ReactionDocument>) {}

  async upsert(userId: Types.ObjectId, orgId: Types.ObjectId, payload: UpsertReactionDto): Promise<ReactionDocument> {
    return this.reactionModel
      .findOneAndUpdate(
        { createdBy: userId, collectionItem: payload.collectionItem, collectionRef: payload.collectionRef },
        { ...payload, updatedBy: userId, $setOnInsert: { orgId, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<ReactionDocument>();
  }

  async getReactionsByUserId(userId: Types.ObjectId): Promise<ReactionDocument[]> {
    return this.reactionModel
      .find({ createdBy: userId, _deleted: { $ne: true } })
      .lean<ReactionDocument[]>();
  }

  async getReactionsCount(collectionItem: string): Promise<number> {
    return this.reactionModel.countDocuments({
      collectionItem,
      _deleted: { $ne: true },
    });
  }
}
