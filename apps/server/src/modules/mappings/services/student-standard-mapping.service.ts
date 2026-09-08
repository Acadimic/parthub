import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudentStandardMapping, StudentStandardMappingDocument } from '../schemas/student-standard-mapping.schema';

@Injectable()
export class StudentStandardMappingService {
  constructor(
    @InjectModel(StudentStandardMapping.name)
    private mappingModel: Model<StudentStandardMappingDocument>,
  ) {}

  async upsert(
    org: Types.ObjectId,
    payload: { student: string; standard: string },
  ): Promise<StudentStandardMappingDocument> {
    return this.mappingModel
      .findOneAndUpdate(
        { student: payload.student, standard: payload.standard, org },
        { ...payload, $setOnInsert: { enrolledAt: new Date() } },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<StudentStandardMappingDocument>();
  }

  async getOrgStudentMaps(org: Types.ObjectId): Promise<StudentStandardMappingDocument[]> {
    return this.mappingModel.find({ org, _deleted: { $ne: true } }).lean<StudentStandardMappingDocument[]>();
  }

  async getStudentStandards(studentId: string): Promise<StudentStandardMappingDocument[]> {
    return this.mappingModel
      .find({ student: studentId, _deleted: { $ne: true } })
      .lean<StudentStandardMappingDocument[]>();
  }

  async getOrgMaps(org: Types.ObjectId): Promise<StudentStandardMappingDocument[]> {
    return this.mappingModel.find({ org, _deleted: { $ne: true } }).lean<StudentStandardMappingDocument[]>();
  }
}
