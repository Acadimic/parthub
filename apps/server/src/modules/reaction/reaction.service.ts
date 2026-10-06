import { ReactionDto } from '@repo/shared/validations';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reaction, ReactionDocument } from './reaction.schema';

@Injectable()
export class ReactionService {
  constructor(@InjectModel(Reaction.name) private reactionModel: Model<ReactionDocument>) {}

  async upsert(userId: Types.ObjectId, payload: ReactionDto): Promise<ReactionDocument> {
    // The row is found by its natural key, so a client that never saw it sends a fresh `_id`;
    // applying that to an existing row is an immutable-field update and a 500.
    const { _id, ...fields } = payload;
    // A payload without `_deleted` means "make it active": the client only ever sees active rows,
    // so its insert-shaped payload may well land on a soft-deleted one that must come back.
    return this.reactionModel
      .findOneAndUpdate(
        { createdBy: userId, collectionItem: payload.collectionItem, collectionRef: payload.collectionRef },
        { $set: { ...fields, _deleted: fields._deleted ?? false }, $setOnInsert: { _id } },
        { returnDocument: 'after', upsert: true, runValidators: true },
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

  /** Like counts for many items in one query, keyed by item id; an item with none is absent. */
  async getCountsByItems(ids: Types.ObjectId[]): Promise<Record<string, number>> {
    if (!ids.length) return {};
    const groups = await this.reactionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { collectionItem: { $in: ids }, _deleted: { $ne: true } } },
      { $group: { _id: '$collectionItem', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(groups.map((group) => [String(group._id), group.count]));
  }
}
