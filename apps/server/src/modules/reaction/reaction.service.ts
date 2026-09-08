import { ReactionDto } from '@parthhub/shared/validations';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reaction, ReactionDocument } from './reaction.schema';

@Injectable()
export class ReactionService {
  constructor(@InjectModel(Reaction.name) private reactionModel: Model<ReactionDocument>) {}

  async upsert(userId: Types.ObjectId, payload: ReactionDto): Promise<ReactionDocument> {
    return this.reactionModel
      .findOneAndUpdate(
        { createdBy: userId, collectionItem: payload.collectionItem, collectionRef: payload.collectionRef },
        { ...payload },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<ReactionDocument>();
  }

  async getReactionsByUserId(userId: Types.ObjectId): Promise<ReactionDocument[]> {
    return this.reactionModel.find({ createdBy: userId, _deleted: { $ne: true } }).lean<ReactionDocument[]>();
  }

  async getReactionsCount(collectionItem: string): Promise<number> {
    return this.reactionModel.countDocuments({
      collectionItem,
      _deleted: { $ne: true },
    });
  }
}
