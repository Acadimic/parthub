import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './course.schema';
import { CourseDto } from '@repo/shared/validations';

@Injectable()
export class CourseService {
  constructor(@InjectModel(Course.name) private courseModel: Model<CourseDocument>) {}

  async upsert(org: Types.ObjectId, payload: CourseDto): Promise<CourseDocument> {
    const { _id } = payload;
    return this.courseModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { new: true, upsert: true, runValidators: true },
      )
      .lean<CourseDocument>();
  }

  async getOrgCourses(org: Types.ObjectId): Promise<CourseDocument[]> {
    return this.courseModel.find({ org, _deleted: { $ne: true } }).lean<CourseDocument[]>();
  }

  async getCoursesByStandardIds(org: Types.ObjectId, standardIds: string[]): Promise<CourseDocument[]> {
    return this.courseModel
      .find({ org, standards: { $in: standardIds }, _deleted: { $ne: true } })
      .lean<CourseDocument[]>();
  }

  async getOrgCourseById(org: Types.ObjectId, id: string): Promise<CourseDocument> {
    return this.courseModel.findOne({ _id: id, org, _deleted: { $ne: true } }).lean<CourseDocument>();
  }

  async getCourseByName(org: Types.ObjectId, name: string): Promise<CourseDocument> {
    return this.courseModel.findOne({ org, name, _deleted: { $ne: true } }).lean<CourseDocument>();
  }

  async findAll(org: string) {
    return this.courseModel.find({ org, _deleted: { $ne: true } }).lean<CourseDocument[]>();
  }

  async findById(id: string) {
    return this.courseModel.findById(id).lean<CourseDocument>();
  }
}
