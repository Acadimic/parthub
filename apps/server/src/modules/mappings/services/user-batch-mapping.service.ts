import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserBatchMapping, UserBatchMappingDocument } from '../schemas/user-batch-mapping.schema';

@Injectable()
export class UserBatchMappingService {
  constructor(
    @InjectModel(UserBatchMapping.name)
    private mappingModel: Model<UserBatchMappingDocument>,
  ) {}

  async upsert(
    userId: Types.ObjectId,
    org: Types.ObjectId,
    payload: { user: string; batch: string },
  ): Promise<UserBatchMappingDocument> {
    return this.mappingModel
      .findOneAndUpdate(
        { user: payload.user, batch: payload.batch, org },
        { ...payload, updatedBy: userId, $setOnInsert: { org, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<UserBatchMappingDocument>();
  }

  async bulkUpsert(
    userId: Types.ObjectId,
    org: Types.ObjectId,
    payloads: { user: string; batch: string }[],
  ): Promise<UserBatchMappingDocument[]> {
    const results: UserBatchMappingDocument[] = [];
    for (const payload of payloads) {
      const result = await this.upsert(userId, org, payload);
      results.push(result);
    }
    return results;
  }

  async getUserMaps(userId: string): Promise<UserBatchMappingDocument[]> {
    return this.mappingModel.find({ user: userId, isDeleted: { $ne: true } }).lean<UserBatchMappingDocument[]>();
  }

  async getBatchMaps(batchId: string): Promise<UserBatchMappingDocument[]> {
    return this.mappingModel.find({ batch: batchId, isDeleted: { $ne: true } }).lean<UserBatchMappingDocument[]>();
  }

  async getOrgMaps(org: Types.ObjectId): Promise<UserBatchMappingDocument[]> {
    return this.mappingModel.find({ org, isDeleted: { $ne: true } }).lean<UserBatchMappingDocument[]>();
  }
}
