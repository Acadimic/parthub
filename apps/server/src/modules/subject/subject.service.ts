import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument } from './subject.schema';
import { SubjectDto } from '@repo/shared/validations';

@Injectable()
export class SubjectService {
  constructor(@InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>) {}

  // `__v` is left out because the support app posts a loaded row straight back on the next edit,
  // where the global `forbidNonWhitelisted` rejects it with "property __v should not exist" — the
  // same reason CourseService and PlanService drop it.
  async upsert(payload: SubjectDto): Promise<SubjectDocument> {
    const { _id } = payload;
    return this.subjectModel
      .findOneAndUpdate(
        { _id },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true, projection: { __v: 0 } },
      )
      .lean<SubjectDocument>();
  }

  /** Sequential like `StandardService.bulkUpsert`: an import of a hundred rows is not worth a bulkWrite. */
  async bulkUpsert(payloads: SubjectDto[]): Promise<SubjectDocument[]> {
    const results: SubjectDocument[] = [];
    for (const payload of payloads) {
      const result = await this.upsert(payload);
      results.push(result);
    }
    return results;
  }

  /** Soft-deletes a subject; `null` when no live row has that id. See `StandardService.softDelete`. */
  async softDelete(subjectId: string): Promise<SubjectDocument | null> {
    return this.subjectModel
      .findOneAndUpdate({ _id: subjectId, _deleted: { $ne: true } }, { _deleted: true }, { returnDocument: 'after' })
      .lean<SubjectDocument>();
  }

  async getAll(): Promise<SubjectDocument[]> {
    return this.subjectModel
      .find({ _deleted: { $ne: true } })
      .select('-__v')
      .lean<SubjectDocument[]>();
  }

  async findAll(org: string) {
    return this.subjectModel.find({ org, _deleted: { $ne: true } }).lean<SubjectDocument[]>();
  }

  async findById(id: string): Promise<SubjectDocument | null> {
    return this.subjectModel.findOne({ _id: id, _deleted: { $ne: true } }).lean<SubjectDocument>();
  }
}
