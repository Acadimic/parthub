import { BatchDto } from '@repo/shared/validations';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Batch, BatchDocument } from './batch.schema';

@Injectable()
export class BatchService {
  constructor(@InjectModel(Batch.name) private batchModel: Model<BatchDocument>) {}

  async upsert(org: Types.ObjectId, payload: BatchDto): Promise<BatchDocument> {
    const { _id } = payload;
    return this.batchModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<BatchDocument>();
  }

  async getOrgBatches(org: Types.ObjectId): Promise<BatchDocument[]> {
    return this.batchModel.find({ org, _deleted: { $ne: true } }).lean<BatchDocument[]>();
  }
}
