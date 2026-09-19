import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument } from './subject.schema';
import { SubjectDto } from '@repo/shared/validations';

@Injectable()
export class SubjectService {
  constructor(@InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>) {}

  async upsert(payload: SubjectDto): Promise<SubjectDocument> {
    const { _id } = payload;
    return this.subjectModel
      .findOneAndUpdate({ _id }, { ...payload }, { returnDocument: 'after', upsert: true, runValidators: true })
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
    return this.subjectModel.find({ _deleted: { $ne: true } }).lean<SubjectDocument[]>();
  }

  async findAll(org: string) {
    return this.subjectModel.find({ org, _deleted: { $ne: true } }).lean<SubjectDocument[]>();
  }

  async findById(id: string) {
    return this.subjectModel.findById(id).lean<SubjectDocument>();
  }
}
