import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from './course.schema';

@Injectable()
export class CourseService {
  constructor(@InjectModel(Course.name) private courseModel: Model<CourseDocument>) {}

  async findAll(org: string) {
    return this.courseModel.find({ orgId: org, _deleted: false });
  }

  async findById(id: string) {
    return this.courseModel.findById(id);
  }
}
