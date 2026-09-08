import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Batch, BatchDocument } from './batch.schema';
import { UpsertBatchDto } from './dto/upsert-batch.dto';

@Injectable()
export class BatchService {
  constructor(@InjectModel(Batch.name) private batchModel: Model<BatchDocument>) {}

  async upsert(userId: Types.ObjectId, org: Types.ObjectId, payload: UpsertBatchDto): Promise<BatchDocument> {
    const { _id } = payload;
    return this.batchModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { org, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<BatchDocument>();
  }

  async getOrgBatches(org: Types.ObjectId): Promise<BatchDocument[]> {
    return this.batchModel.find({ org, _deleted: { $ne: true } }).lean<BatchDocument[]>();
  }
}
