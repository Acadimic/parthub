import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StandardSubjectMapping, StandardSubjectMappingDocument } from './standard-subject-mapping.schema';
import { StandardSubjectMappingDto } from '@repo/shared/validations';

@Injectable()
export class StandardSubjectMappingService {
  constructor(
    @InjectModel(StandardSubjectMapping.name)
    private mappingModel: Model<StandardSubjectMappingDocument>,
  ) {}

  // `__v` is left out because the support app posts a loaded row straight back on the next edit,
  // where the global `forbidNonWhitelisted` rejects it with "property __v should not exist" — the
  // same reason CourseService and PlanService drop it.
  async upsert(payload: StandardSubjectMappingDto): Promise<StandardSubjectMappingDocument> {
    const { _id } = payload;
    return this.mappingModel
      .findOneAndUpdate(
        { _id },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true, projection: { __v: 0 } },
      )
      .lean<StandardSubjectMappingDocument>();
  }

  async upsertMany(payloads: StandardSubjectMappingDto[]): Promise<StandardSubjectMappingDocument[]> {
    const results: StandardSubjectMappingDocument[] = [];
    for (const payload of payloads) {
      const result = await this.upsert(payload);
      results.push(result);
    }
    return results;
  }

  async getAll(): Promise<StandardSubjectMappingDocument[]> {
    return this.mappingModel
      .find({ _deleted: { $ne: true } })
      .select('-__v')
      .sort({ order: 1 })
      .lean<StandardSubjectMappingDocument[]>();
  }

  /** Soft-deletes every mapping of a standard — the companion of `StandardService.softDelete`. */
  async deleteStandardMappings(standardId: string): Promise<void> {
    await this.mappingModel.updateMany({ standard: standardId, _deleted: { $ne: true } }, { _deleted: true });
  }

  /** Soft-deletes every mapping of a subject, across all standards — the companion of `SubjectService.softDelete`. */
  async deleteSubjectMappings(subjectId: string): Promise<void> {
    await this.mappingModel.updateMany({ subject: subjectId, _deleted: { $ne: true } }, { _deleted: true });
  }
}
