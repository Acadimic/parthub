import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument } from './subject.schema';
import { UpsertSubjectDto } from '@parthhub/shared/validations';

@Injectable()
export class SubjectService {
  constructor(@InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>) {}

  async upsert(payload: UpsertSubjectDto): Promise<SubjectDocument> {
    const { _id } = payload;
    return this.subjectModel
      .findOneAndUpdate({ _id }, { ...payload }, { new: true, upsert: true, runValidators: true })
      .lean<SubjectDocument>();
  }

  async getAll(): Promise<SubjectDocument[]> {
    return this.subjectModel.find({ _deleted: { $ne: true } }).lean<SubjectDocument[]>();
  }

  async findAll(org: string) {
    return this.subjectModel.find({ orgId: org, _deleted: false }).lean<SubjectDocument[]>();
  }

  async findById(id: string) {
    return this.subjectModel.findById(id).lean<SubjectDocument>();
  }
}
