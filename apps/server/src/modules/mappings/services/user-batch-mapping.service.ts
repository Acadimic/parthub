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
    orgId: Types.ObjectId,
    payload: { user: string; batch: string },
  ): Promise<UserBatchMappingDocument> {
    return this.mappingModel
      .findOneAndUpdate(
        { user: payload.user, batch: payload.batch, orgId },
        { ...payload, updatedBy: userId, $setOnInsert: { orgId, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<UserBatchMappingDocument>();
  }

  async bulkUpsert(
    userId: Types.ObjectId,
    orgId: Types.ObjectId,
    payloads: { user: string; batch: string }[],
  ): Promise<UserBatchMappingDocument[]> {
    const results: UserBatchMappingDocument[] = [];
    for (const payload of payloads) {
      const result = await this.upsert(userId, orgId, payload);
      results.push(result);
    }
    return results;
  }

  async getUserMaps(userId: string): Promise<UserBatchMappingDocument[]> {
    return this.mappingModel
      .find({ user: userId, _deleted: { $ne: true } })
      .lean<UserBatchMappingDocument[]>();
  }

  async getBatchMaps(batchId: string): Promise<UserBatchMappingDocument[]> {
    return this.mappingModel
      .find({ batch: batchId, _deleted: { $ne: true } })
      .lean<UserBatchMappingDocument[]>();
  }

  async getOrgMaps(orgId: Types.ObjectId): Promise<UserBatchMappingDocument[]> {
    return this.mappingModel
      .find({ orgId, _deleted: { $ne: true } })
      .lean<UserBatchMappingDocument[]>();
  }
}
