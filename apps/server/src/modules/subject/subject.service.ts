import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument } from './subject.schema';

@Injectable()
export class SubjectService {
  constructor(@InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>) {}

  async findAll(org: string) {
    return this.subjectModel.find({ orgId: org, _deleted: false });
  }

  async findById(id: string) {
    return this.subjectModel.findById(id);
  }
}
