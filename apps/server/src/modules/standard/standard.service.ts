import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Standard, StandardDocument } from './standard.schema';
import { StandardDto } from '@repo/shared/validations';

@Injectable()
export class StandardService {
  constructor(@InjectModel(Standard.name) private standardModel: Model<StandardDocument>) {}

  async upsert(payload: StandardDto): Promise<StandardDocument> {
    const { _id } = payload;
    return this.standardModel
      .findOneAndUpdate({ _id }, { ...payload }, { new: true, upsert: true, runValidators: true })
      .lean<StandardDocument>();
  }

  async bulkUpsert(payloads: StandardDto[]): Promise<StandardDocument[]> {
    const results: StandardDocument[] = [];
    for (const payload of payloads) {
      const result = await this.upsert(payload);
      results.push(result);
    }
    return results;
  }

  async getAll(): Promise<StandardDocument[]> {
    return this.standardModel
      .find({ _deleted: { $ne: true } })
      .sort({ order: 1 })
      .lean<StandardDocument[]>();
  }
}
