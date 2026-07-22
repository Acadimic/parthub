import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StandardSubjectMapping, StandardSubjectMappingDocument } from './standard-subject-mapping.schema';
import { UpsertStandardSubjectMappingDto } from './dto/upsert-standard-subject-mapping.dto';

@Injectable()
export class StandardSubjectMappingService {
  constructor(
    @InjectModel(StandardSubjectMapping.name)
    private mappingModel: Model<StandardSubjectMappingDocument>,
  ) {}

  async upsert(payload: UpsertStandardSubjectMappingDto): Promise<StandardSubjectMappingDocument> {
    const { _id } = payload;
    return this.mappingModel
      .findOneAndUpdate({ _id }, { ...payload }, { new: true, upsert: true, runValidators: true })
      .lean<StandardSubjectMappingDocument>();
  }

  async upsertMany(payloads: UpsertStandardSubjectMappingDto[]): Promise<StandardSubjectMappingDocument[]> {
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
      .sort({ order: 1 })
      .lean<StandardSubjectMappingDocument[]>();
  }

  async deleteStandardMappings(standardId: string): Promise<void> {
    await this.mappingModel.updateMany({ standard: standardId }, { _deleted: true });
  }
}
