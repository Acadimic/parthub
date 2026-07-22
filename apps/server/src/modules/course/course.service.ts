import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './course.schema';
import { UpsertCourseDto } from '@parthhub/shared/validations';

@Injectable()
export class CourseService {
  constructor(@InjectModel(Course.name) private courseModel: Model<CourseDocument>) {}

  async upsert(userId: Types.ObjectId, orgId: Types.ObjectId, payload: UpsertCourseDto): Promise<CourseDocument> {
    const { _id } = payload;
    return this.courseModel
      .findOneAndUpdate(
        { _id },
        { ...payload, updatedBy: userId, $setOnInsert: { orgId, createdBy: userId } },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<CourseDocument>();
  }

  async getOrgCourses(orgId: Types.ObjectId): Promise<CourseDocument[]> {
    return this.courseModel.find({ orgId, _deleted: { $ne: true } }).lean<CourseDocument[]>();
  }

  async getCoursesByStandardIds(orgId: Types.ObjectId, standardIds: string[]): Promise<CourseDocument[]> {
    return this.courseModel
      .find({ orgId, standards: { $in: standardIds }, _deleted: { $ne: true } })
      .lean<CourseDocument[]>();
  }

  async getCourseById(id: string): Promise<CourseDocument> {
    return this.courseModel.findById(id).lean<CourseDocument>();
  }

  async getCourseByName(orgId: Types.ObjectId, name: string): Promise<CourseDocument> {
    return this.courseModel.findOne({ orgId, name, _deleted: { $ne: true } }).lean<CourseDocument>();
  }

  async findAll(org: string) {
    return this.courseModel.find({ orgId: org, _deleted: false }).lean<CourseDocument[]>();
  }

  async findById(id: string) {
    return this.courseModel.findById(id).lean<CourseDocument>();
  }
}
