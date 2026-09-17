import { Injectable } from '@nestjs/common';
import { getTransformedBaseFields } from '@database/base.transform';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './course.schema';
import { CourseDto } from '@repo/shared/validations';

@Injectable()
export class CourseService {
  constructor(@InjectModel(Course.name) private courseModel: Model<CourseDocument>) {}

  /**
   * The wire shape of a course.
   *
   * Spread rather than a field list, so a plain field added to the schema needs no change here.
   * Only the values whose stored type differs from the contract are named: an `ObjectId` becomes a
   * string, a `Date` an ISO string.
   *
   * `__v` is removed because the apps post a loaded row straight back on the next edit, where the
   * global `forbidNonWhitelisted` rejects it with "property __v should not exist".
   */
  getTransformedCourse(course: CourseDocument): CourseDto {
    // Cast only to make the delete legal: `HydratedDocument` types `__v` as required, and TypeScript
    // refuses `delete` on a non-optional property.
    delete (course as { __v?: number }).__v;
    return {
      ...course,
      ...getTransformedBaseFields(course),
      standards: (course.standards ?? []).map(String),
      subjects: (course.subjects ?? []).map(String),
      courses: (course.courses ?? []).map(String),
      meets: (course.meets ?? []).map(String),
      publishedDate: course.publishedDate?.toISOString(),
    };
  }

  /** The list form, for the `find()` routes. */
  getTransformedCourses(courses: CourseDocument[]): CourseDto[] {
    return (courses ?? []).map((course) => this.getTransformedCourse(course));
  }

  async upsert(org: Types.ObjectId, payload: CourseDto): Promise<CourseDto> {
    const { _id } = payload;
    return this.courseModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<CourseDocument>()
      .then((course) => this.getTransformedCourse(course));
  }

  async getOrgCourses(org: Types.ObjectId): Promise<CourseDto[]> {
    return this.courseModel
      .find({ org, _deleted: { $ne: true } })
      .lean<CourseDocument[]>()
      .then((courses) => this.getTransformedCourses(courses));
  }

  async getCoursesByStandardIds(org: Types.ObjectId, standardIds: string[]): Promise<CourseDto[]> {
    return this.courseModel
      .find({ org, standards: { $in: standardIds }, _deleted: { $ne: true } })
      .lean<CourseDocument[]>()
      .then((courses) => this.getTransformedCourses(courses));
  }

  async getOrgCourseById(org: Types.ObjectId, id: string): Promise<CourseDto | null> {
    return this.courseModel
      .findOne({ _id: id, org, _deleted: { $ne: true } })
      .lean<CourseDocument>()
      .then((course) => (course ? this.getTransformedCourse(course) : null));
  }

  async getCourseByName(org: Types.ObjectId, name: string): Promise<CourseDto | null> {
    return this.courseModel
      .findOne({ org, name, _deleted: { $ne: true } })
      .lean<CourseDocument>()
      .then((course) => (course ? this.getTransformedCourse(course) : null));
  }

  async findAll(org: string) {
    return this.courseModel
      .find({ org, _deleted: { $ne: true } })
      .lean<CourseDocument[]>()
      .then((courses) => this.getTransformedCourses(courses));
  }

  async findById(id: string) {
    return this.courseModel
      .findById(id)
      .lean<CourseDocument>()
      .then((course) => (course ? this.getTransformedCourse(course) : null));
  }
}
