import { getTransformedBaseFields } from '@database/base.transform';
import { PlanService } from '@modules/plan/plan.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CourseDto, CourseModuleDto, CourseWithPlansDto, LinkCourseModuleDto, PlanDto } from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './course.schema';
import { CourseModule, CourseModuleDocument } from './schemas/course-module.schema';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    private readonly planService: PlanService,
  ) {}

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
      .then((course) => {
        // `lean<T>()` states the element type and drops the `| null` an upsert can still return, so
        // the miss has to be checked rather than trusted.
        if (!course) throw new InternalServerErrorException('Course was not saved.');
        return this.getTransformedCourse(course);
      });
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

  /**
   * The wire shape of a course module.
   *
   * Spread rather than a field list, so a plain field added to the schema needs no change here.
   * Only the values whose stored type differs from the contract are named: an `ObjectId` becomes a
   * string, a `Date` an ISO string.
   *
   * `__v` is removed because the apps post a loaded row straight back on the next edit, where the
   * global `forbidNonWhitelisted` rejects it with "property __v should not exist".
   */
  getTransformedCourseModule(courseModule: CourseModuleDocument): CourseModuleDto {
    // Cast only to make the delete legal: `HydratedDocument` types `__v` as required, and TypeScript
    // refuses `delete` on a non-optional property.
    delete (courseModule as { __v?: number }).__v;
    return {
      ...courseModule,
      ...getTransformedBaseFields(courseModule),
      course: courseModule.course?.toString(),
      materials: (courseModule.materials ?? []).map(String),
      testPapers: (courseModule.testPapers ?? []).map(String),
      meets: (courseModule.meets ?? []).map(String),
    };
  }

  /** The list form, for the `find()` routes. */
  getTransformedCourseModules(courseModules: CourseModuleDocument[]): CourseModuleDto[] {
    return (courseModules ?? []).map((courseModule) => this.getTransformedCourseModule(courseModule));
  }

  async upsertCourseModule(org: Types.ObjectId, payload: CourseModuleDto): Promise<CourseModuleDto> {
    const { _id } = payload;
    return this.courseModuleModel
      .findOneAndUpdate(
        // org in the filter so an upsert cannot reach another organization's document
        { _id, org },
        { ...payload },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<CourseModuleDocument>()
      .then((courseModule) => {
        if (!courseModule) throw new InternalServerErrorException('Course module was not saved.');
        return this.getTransformedCourseModule(courseModule);
      });
  }

  /** One at a time, in file order, so the unique `(course, day)` index sees each day once. */
  async bulkUpsertCourseModules(org: Types.ObjectId, modules: CourseModuleDto[]): Promise<CourseModuleDto[]> {
    const saved: CourseModuleDto[] = [];
    for (const courseModule of modules) {
      saved.push(await this.upsertCourseModule(org, courseModule));
    }
    return saved;
  }

  /**
   * Appends content ids to a module and marks pending items done.
   *
   * `$addToSet` keeps a retried link from duplicating an id; the pending array is rewritten from the
   * stored one because a positional update per key would need one round trip each.
   */
  async linkCourseModule(org: Types.ObjectId, payload: LinkCourseModuleDto): Promise<CourseModuleDto | null> {
    const current = await this.courseModuleModel
      .findOne({ _id: payload.courseModule, org, _deleted: { $ne: true } })
      .lean<CourseModuleDocument>();
    if (!current) return null;
    const doneByKey = new Map((payload.done ?? []).map((item) => [item.key, item.createdId]));
    const pending = (current.pending ?? []).map((work) =>
      doneByKey.has(work.key)
        ? { ...work, status: 'done' as const, createdId: doneByKey.get(work.key) ?? work.createdId }
        : work,
    );
    return this.courseModuleModel
      .findOneAndUpdate(
        { _id: payload.courseModule, org },
        {
          $set: { pending },
          $addToSet: {
            materials: { $each: payload.materials ?? [] },
            testPapers: { $each: payload.testPapers ?? [] },
            meets: { $each: payload.meets ?? [] },
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .lean<CourseModuleDocument>()
      .then((courseModule) => (courseModule ? this.getTransformedCourseModule(courseModule) : null));
  }

  /** A course's modules in the order a learner works through them; `day` is the running order. */
  async getOrgCourseModules(org: Types.ObjectId, courseId: string): Promise<CourseModuleDto[]> {
    return this.courseModuleModel
      .find({ org, course: courseId, _deleted: { $ne: true } })
      .sort({ day: 1 })
      .lean<CourseModuleDocument[]>()
      .then((courseModules) => this.getTransformedCourseModules(courseModules));
  }

  /**
   * Saves a course and its plans together.
   *
   * Two independent upserts rather than one atomic write: there are no transactions on this
   * deployment, so a partial failure is possible and is left to the client to retry. Both writes
   * are idempotent on their client-minted `_id`, which is what makes that retry safe.
   */
  async upsertCourseAndPlans(
    org: Types.ObjectId,
    payload: CourseWithPlansDto,
  ): Promise<{ course: CourseDto; plans: PlanDto[] }> {
    const course = await this.upsert(org, payload.course);
    const plans = await Promise.all(payload.plans.map((plan) => this.planService.upsert(org, plan)));
    return { course, plans };
  }
}
