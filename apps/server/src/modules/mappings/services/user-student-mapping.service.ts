import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserStudentMapping, UserStudentMappingDocument } from '../schemas/user-student-mapping.schema';

@Injectable()
export class UserStudentMappingService {
  constructor(
    @InjectModel(UserStudentMapping.name)
    private mappingModel: Model<UserStudentMappingDocument>,
  ) {}

  async upsert(
    userId: Types.ObjectId,
    orgId: Types.ObjectId,
    payload: { user: string; student: string },
  ): Promise<UserStudentMappingDocument> {
    return this.mappingModel
      .findOneAndUpdate(
        { user: payload.user, student: payload.student },
        { ...payload, updatedBy: userId, $setOnInsert: { orgId, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<UserStudentMappingDocument>();
  }

  async getUserMaps(userId: string): Promise<UserStudentMappingDocument[]> {
    return this.mappingModel
      .find({ user: userId, _deleted: { $ne: true } })
      .lean<UserStudentMappingDocument[]>();
  }

  async getStudentMaps(studentId: string): Promise<UserStudentMappingDocument[]> {
    return this.mappingModel
      .find({ student: studentId, _deleted: { $ne: true } })
      .lean<UserStudentMappingDocument[]>();
  }

  async getOrgMaps(orgId: Types.ObjectId): Promise<UserStudentMappingDocument[]> {
    return this.mappingModel
      .find({ orgId, _deleted: { $ne: true } })
      .lean<UserStudentMappingDocument[]>();
  }
}
