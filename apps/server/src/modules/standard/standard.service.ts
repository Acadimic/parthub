import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Standard, StandardDocument } from './standard.schema';
import { StandardDto } from '@repo/shared/validations';

@Injectable()
export class StandardService {
  constructor(@InjectModel(Standard.name) private standardModel: Model<StandardDocument>) {}

  // `__v` is left out because the support app posts a loaded row straight back on the next edit,
  // where the global `forbidNonWhitelisted` rejects it with "property __v should not exist" — the
  // same reason CourseService and PlanService drop it.
  async upsert(payload: StandardDto): Promise<StandardDocument> {
    const { _id } = payload;
    return this.standardModel
      .findOneAndUpdate(
        { _id },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true, projection: { __v: 0 } },
      )
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

  /**
   * Soft-deletes a standard. `null` when there is no live row with that id, so the controller can
   * answer 404 rather than report a delete that touched nothing.
   */
  async softDelete(standardId: string): Promise<StandardDocument | null> {
    return this.standardModel
      .findOneAndUpdate({ _id: standardId, _deleted: { $ne: true } }, { _deleted: true }, { returnDocument: 'after' })
      .lean<StandardDocument>();
  }

  async getAll(): Promise<StandardDocument[]> {
    return this.standardModel
      .find({ _deleted: { $ne: true } })
      .select('-__v')
      .sort({ order: 1 })
      .lean<StandardDocument[]>();
  }
}
