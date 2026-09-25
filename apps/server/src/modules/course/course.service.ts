import { getTransformedBaseFields } from '@database/base.transform';
import { MaterialService } from '@modules/material/material.service';
import { MeetService } from '@modules/meet/meet.service';
import { PlanService } from '@modules/plan/plan.service';
import { TestPaperService } from '@modules/test-paper/test-paper.service';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type TestPaperSectionsResponse } from '@repo/shared/contracts';
import {
  CompletedModuleDto,
  CourseDto,
  CourseModuleDto,
  CourseWithPlansDto,
  LinkCourseModuleDto,
  MaterialDto,
  MeetDto,
  PlanDto,
  TestPaperDto,
} from '@repo/shared/validations';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './course.schema';
import { CompletedModule, CompletedModuleDocument } from './schemas/completed-module.schema';
import { CourseModule, CourseModuleDocument } from './schemas/course-module.schema';

/**
 * A module with its items embedded rather than as ids.
 *
 * Declared here because it is a composition of existing contracts rather than an entity of its
 * own; the learning app declares the matching shape at its own service boundary.
 */
export interface ICourseModuleContents extends Omit<CourseModuleDto, 'materials' | 'testPapers' | 'meets'> {
  materials: MaterialDto[];
  testPapers: TestPaperDto[];
  meets: MeetDto[];
}

/**
 * A course as the catalogue lists it: the course, plus the topics its modules cover.
 *
 * `topics` is read from the modules rather than stored on the course, so it cannot drift from what
 * the course actually teaches. It is what the learning app's topic filter offers, which is why the
 * catalogue carries it and the single-course routes do not.
 */
export interface IPublishedCourse extends CourseDto {
  topics: string[];
}

@Injectable()
export class CourseService {
  // NestJS injects collaborators through the constructor, so the count reflects this class's
  // dependencies rather than a parameter list that could be shortened by extraction.
  // eslint-disable-next-line max-params
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    @InjectModel(CompletedModule.name) private completedModuleModel: Model<CompletedModuleDocument>,
    private readonly planService: PlanService,
    private readonly materialService: MaterialService,
    private readonly testPaperService: TestPaperService,
    private readonly meetService: MeetService,
  ) {}

  /** The wire shape of a learner's progress row. */
  getTransformedCompletedModule(completedModule: CompletedModuleDocument): CompletedModuleDto {
    delete (completedModule as { __v?: number }).__v;
    return {
      ...completedModule,
      ...getTransformedBaseFields(completedModule),
      course: String(completedModule.course),
      courseModule: String(completedModule.courseModule),
      collectionItem: String(completedModule.collectionItem),
    };
  }

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

  /**
   * The public catalogue: published courses from every organization, newest first.
   *
   * Deliberately not org-scoped — unlike every other read here — because `isPublished` is the
   * organization's own opt-in to being listed, and the catalogue is browsed by anonymous visitors
   * who have no organization at all.
   */
  async getPublishedCourses(): Promise<IPublishedCourse[]> {
    const courses = await this.courseModel
      .find({ isPublished: true, _deleted: { $ne: true } })
      .sort({ publishedDate: -1 })
      .lean<CourseDocument[]>();
    const topicsByCourseId = await this.getTopicsByCourseId(courses.map((course) => String(course._id)));
    return courses.map((course) => ({
      ...this.getTransformedCourse(course),
      topics: topicsByCourseId.get(String(course._id)) ?? [],
    }));
  }

  /**
   * The distinct topics each course's modules cover, in the order the modules list them.
   *
   * One query for every course rather than one per course: the catalogue is unbounded, so a lookup
   * inside the map would grow with it.
   */
  private async getTopicsByCourseId(courseIds: string[]): Promise<Map<string, string[]>> {
    if (!courseIds.length) return new Map();
    const courseModules = await this.courseModuleModel
      .find({ course: { $in: courseIds }, _deleted: { $ne: true } }, { course: 1, topics: 1 })
      .sort({ day: 1 })
      .lean<Pick<CourseModuleDocument, 'course' | 'topics'>[]>();
    return courseModules.reduce((byCourseId, courseModule) => {
      const courseId = String(courseModule.course);
      const topics = byCourseId.get(courseId) ?? [];
      (courseModule.topics ?? []).forEach((topic) => {
        if (topic && !topics.includes(topic)) topics.push(topic);
      });
      byCourseId.set(courseId, topics);
      return byCourseId;
    }, new Map<string, string[]>());
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
   * The course a learner may open: their own organization's, or anyone's once it is published.
   * Returns `null` when neither holds, which the controller turns into a 404 — the same answer a
   * missing course gives, so this does not confirm that another organization's draft exists.
   */
  async getVisibleCourse(org: Types.ObjectId, courseId: string): Promise<CourseDocument | null> {
    return this.courseModel
      .findOne({ _id: courseId, _deleted: { $ne: true }, $or: [{ isPublished: true }, { org }] })
      .lean<CourseDocument>();
  }

  /**
   * A course's modules with their materials, test papers and meets embedded rather than as ids —
   * the shape the learning app's course screen reads.
   *
   * Contents are looked up under the **course's** organization, not the caller's: a published
   * course is visible across organizations, and scoping to the viewer would return a module whose
   * every item is missing.
   */
  async getCourseModulesWithContents(org: Types.ObjectId, courseId: string): Promise<ICourseModuleContents[] | null> {
    const course = await this.getVisibleCourse(org, courseId);
    if (!course) return null;

    const courseOrg = course.org;
    const courseModules = await this.courseModuleModel
      .find({ course: courseId, _deleted: { $ne: true } })
      .sort({ day: 1 })
      .lean<CourseModuleDocument[]>();

    const idsOf = (key: 'materials' | 'testPapers' | 'meets') => [
      ...new Set(courseModules.flatMap((courseModule) => (courseModule[key] ?? []).map(String))),
    ];
    const [materials, testPapers, meets] = await Promise.all([
      this.materialService.getByIds(courseOrg, idsOf('materials')),
      this.testPaperService.getByIds(courseOrg, idsOf('testPapers')),
      // Meets are the one collection here with no transform step, so its lean documents stand in
      // for the contract. The wire shape is right — an ObjectId serialises to the string `MeetDto`
      // declares — but `_id` is typed `ObjectId`, so the compiler needs `unknown` in between.
      this.meetService.getMeetsByIds(idsOf('meets')) as unknown as Promise<MeetDto[]>,
    ]);

    const byId = <T extends { _id: string }>(rows: T[]) => new Map(rows.map((row) => [row._id, row]));
    const materialById = byId(materials);
    const testPaperById = byId(testPapers);
    const meetById = byId(meets);

    // A soft-deleted item is absent from the lookup, so `filter(Boolean)` drops it rather than
    // leaving an undefined hole the client would render.
    const pick = <T>(ids: string[] | undefined, map: Map<string, T>): T[] =>
      (ids ?? []).map((id) => map.get(String(id))).filter((row): row is T => !!row);

    return courseModules.map((courseModule) => ({
      ...this.getTransformedCourseModule(courseModule),
      materials: pick(courseModule.materials, materialById),
      testPapers: pick(courseModule.testPapers, testPaperById),
      meets: pick(courseModule.meets, meetById),
    }));
  }

  /**
   * A test paper as it sits in a course the caller may open, with its sections and questions.
   *
   * Exists alongside `test-paper/sections-with-questions` because that route reads under the
   * caller's organization and answers with an empty paper for a course someone else published.
   * Both the course's visibility and the paper's place in it are checked before anything is read,
   * so this widens the reach by exactly one course's test papers and nothing else.
   */
  async getCourseTestPaperSections(
    org: Types.ObjectId,
    courseId: string,
    testPaperId: string,
  ): Promise<TestPaperSectionsResponse | null> {
    const course = await this.getVisibleCourse(org, courseId);
    if (!course) return null;
    const courseModule = await this.courseModuleModel
      .findOne({ course: courseId, testPapers: testPaperId, _deleted: { $ne: true } })
      .lean<CourseModuleDocument>();
    if (!courseModule) return null;
    return this.testPaperService.getSectionsWithQuestions(course.org, testPaperId);
  }

  /** Every module item the caller has marked complete or skipped, across their courses. */
  async getCompletedModules(userId: Types.ObjectId): Promise<CompletedModuleDto[]> {
    return this.completedModuleModel
      .find({ createdBy: userId, _deleted: { $ne: true } })
      .lean<CompletedModuleDocument[]>()
      .then((rows) => rows.map((row) => this.getTransformedCompletedModule(row)));
  }

  /**
   * Marks one module item complete or skipped.
   *
   * Filtered by `createdBy` as well as `_id` so a client-minted id cannot overwrite another
   * learner's progress row.
   */
  async upsertCompletedModule(
    org: Types.ObjectId,
    userId: Types.ObjectId,
    payload: CompletedModuleDto,
  ): Promise<CompletedModuleDto> {
    const { _id } = payload;
    return this.completedModuleModel
      .findOneAndUpdate(
        { _id, createdBy: userId },
        { ...payload, org },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .lean<CompletedModuleDocument>()
      .then((row) => {
        if (!row) throw new InternalServerErrorException('Completed module could not be saved.');
        return this.getTransformedCompletedModule(row);
      });
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
