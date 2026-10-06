import { getTransformedBaseFields } from '@database/base.transform';
import { MaterialService } from '@modules/material/material.service';
import { MeetService } from '@modules/meet/meet.service';
import { Subdomain } from '@repo/shared/enums';
import { PlanService } from '@modules/plan/plan.service';
import { EnrollmentService } from '@modules/enrollment/enrollment.service';
import { RequestContextService } from '../../context/request-context.service';
import { TestPaperService } from '@modules/test-paper/test-paper.service';
import { TestPaperResultService } from '@modules/test-paper/test-paper-result.service';
import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
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
  TestPaperResultDto,
} from '@repo/shared/validations';
import { Model, Types, mongo } from 'mongoose';
import { DUPLICATE_KEY } from '../../filters/mongo-duplicate-key.filter';
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
 * Dropped from list reads: the learning catalogue and the teaching course list. These are the AI
 * generator's syllabus arrays — a line per topic, so dozens on a generated course — and only the
 * teaching course review reads them, from the course page's read by id. Stated as an exclusion
 * rather than a field list so the transform keeps the ownership fields it needs.
 */
const CATALOGUE_EXCLUDED_FIELDS = { outline: 0, outcomes: 0, prerequisites: 0 } as const;

/** Whether module contents arrive whole, or as a syllabus with no lesson bodies or files. */
export type CourseModulesShape = 'contents' | 'outline';

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
    private readonly testPaperResultService: TestPaperResultService,
    private readonly meetService: MeetService,
    private readonly enrollmentService: EnrollmentService,
    private readonly requestContextService: RequestContextService,
  ) {}

  // The public reads: a visitor who is not signed in has no organization to scope by, so each of these
  // answers for published courses only, and none takes an org.

  /**
   * The public catalogue: published courses from every organization, in each course's display
   * `order` (set by its teacher on the Courses page), newest first among equal orders.
   *
   * Not org-scoped because `isPublished` is the organization's own opt-in to being listed, and the
   * catalogue is browsed by anonymous visitors who have no organization at all.
   */
  async getPublicCourses(): Promise<CourseDto[]> {
    return this.courseModel
      .find({ isPublished: true, _deleted: { $ne: true } }, CATALOGUE_EXCLUDED_FIELDS)
      .sort({ order: 1, publishedDate: -1 })
      .lean<CourseDocument[]>()
      .then((courses) => this.getTransformedCourses(courses));
  }

  // An id that is not an ObjectId would make Mongoose throw a CastError; for a public route it is a 404.
  private async findPublicCourse(courseId: string): Promise<CourseDocument | null> {
    if (!Types.ObjectId.isValid(courseId)) return null;
    return this.courseModel
      .findOne({ _id: courseId, isPublished: true, _deleted: { $ne: true } }, CATALOGUE_EXCLUDED_FIELDS)
      .lean<CourseDocument>();
  }

  /** One published course as the catalogue lists it, for a shared link's preview. */
  async getPublicCourse(courseId: string): Promise<CourseDto | null> {
    const course = await this.findPublicCourse(courseId);
    return course ? this.getTransformedCourse(course) : null;
  }

  /**
   * One published course by its public address. `_deleted: false` rather than the usual `$ne: true`
   * so the partial unique index on `slug` serves the lookup.
   */
  async getPublicCourseBySlug(slug: string): Promise<CourseDto | null> {
    return this.courseModel
      .findOne({ slug, isPublished: true, _deleted: false }, CATALOGUE_EXCLUDED_FIELDS)
      .lean<CourseDocument>()
      .then((course) => (course ? this.getTransformedCourse(course) : null));
  }

  /**
   * The syllabus a learner sees, less each live session's link and attendees, which are for the
   * people enrolled.
   */
  async getPublicCourseOutline(courseId: string): Promise<ICourseModuleContents[] | null> {
    const course = await this.findPublicCourse(courseId);
    if (!course) return null;
    const courseModules = await this.getModulesOfCourse(course, 'outline', null);
    return courseModules.map((courseModule) => ({
      ...courseModule,
      meets: courseModule.meets.map(({ meetingLink, meetingId, attendees, ...meet }) => meet),
    }));
  }

  /** The plans a published course is sold on. */
  async getPublicCoursePlans(courseId: string): Promise<PlanDto[] | null> {
    const course = await this.findPublicCourse(courseId);
    if (!course) return null;
    return this.planService.getPlansByCourseId(course.org, courseId);
  }

  /**
   * Whether the caller may open a course's contents. A teacher reads their own courses from the
   * teaching app without a seat; a learner needs one on any course that carries a price.
   */
  private async canOpen(course: CourseDocument): Promise<boolean> {
    if (this.requestContextService.getSubdomain() !== Subdomain.LEARN) return true;
    return this.enrollmentService.hasAccess(this.requestContextService.getUserId(), course);
  }

  /** The plans a visible course is sold on, for the learner to pick from. */
  async getVisibleCoursePlans(org: Types.ObjectId, courseId: string): Promise<PlanDto[] | null> {
    const course = await this.getVisibleCourse(org, courseId);
    if (!course) return null;
    return this.planService.getPlansByCourseId(course.org, courseId);
  }

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
      })
      .catch((error: unknown) => {
        // The slug is the name's public address, so a taken slug is a taken name to the teacher.
        const isSlugTaken =
          error instanceof mongo.MongoServerError && error.code === DUPLICATE_KEY && 'slug' in (error.keyValue ?? {});
        if (isSlugTaken) {
          throw new ConflictException('Another course already uses this name. Please choose a different name.');
        }
        throw error;
      });
  }

  async getOrgCourses(org: Types.ObjectId): Promise<CourseDto[]> {
    return this.courseModel
      .find({ org, _deleted: { $ne: true } })
      .select(CATALOGUE_EXCLUDED_FIELDS)
      .sort({ order: 1, createdAt: 1 })
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
   * the shape the learning app's course screen reads. `outline` is the same rows with every lesson
   * body and file left out: what a preview or an activity list needs, at a fraction of the size.
   *
   * Contents are looked up under the **course's** organization, not the caller's: a published
   * course is visible across organizations, and scoping to the viewer would return a module whose
   * every item is missing.
   */
  async getCourseModulesWithContents(
    org: Types.ObjectId,
    courseId: string,
    shape: CourseModulesShape = 'contents',
    /** One module rather than all of them, for a printout of that module alone. */
    moduleId: string | null = null,
  ): Promise<ICourseModuleContents[] | null> {
    const course = await this.getVisibleCourse(org, courseId);
    if (!course) return null;
    return this.getModulesOfCourse(course, shape, moduleId);
  }

  /**
   * The modules of a course the caller has already been allowed to see. Split from the lookup so a
   * public read can resolve a published course its own way and assemble it the same.
   */
  private async getModulesOfCourse(
    course: CourseDocument,
    shape: CourseModulesShape,
    moduleId: string | null,
  ): Promise<ICourseModuleContents[]> {
    const courseId = String(course._id);
    const isOutline = shape === 'outline';

    const courseOrg = course.org;
    const courseModules = await this.courseModuleModel
      .find({ course: courseId, ...(moduleId ? { _id: moduleId } : {}), _deleted: { $ne: true } })
      .sort({ day: 1 })
      .lean<CourseModuleDocument[]>();

    const idsOf = (key: 'materials' | 'testPapers' | 'meets') => [
      ...new Set(courseModules.flatMap((courseModule) => (courseModule[key] ?? []).map(String))),
    ];
    const [materials, testPapers, meets] = await Promise.all([
      isOutline
        ? this.materialService.getOutlineByIds(courseOrg, idsOf('materials'))
        : this.materialService.getByIds(courseOrg, idsOf('materials')),
      this.testPaperService.getByIds(courseOrg, idsOf('testPapers')),
      // Meets are the one collection here with no transform step, so its lean documents stand in
      // for the contract. The wire shape is right — an ObjectId serialises to the string `MeetDto`
      // declares — but `_id` is typed `ObjectId`, so the compiler needs `unknown` in between.
      this.meetService.getMeetsByIds(idsOf('meets')) as unknown as Promise<MeetDto[]>,
    ]);

    // Without a seat the outline is still shown — names, kinds, durations — but a lesson arrives
    // with no body or files, and the test and progress routes refuse below, so nothing is readable.
    // An outline already carries no body, so the seat check is skipped along with the query it costs.
    const isLocked = isOutline ? false : !(await this.canOpen(course));
    const lockedMaterials = isLocked
      ? materials.map((material) => ({ ...material, content: undefined, attachments: [] }))
      : materials;

    const byId = <T extends { _id: string }>(rows: T[]) => new Map(rows.map((row) => [row._id, row]));
    const materialById = byId(lockedMaterials);
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
    if (!(await this.canOpen(course))) throw new ForbiddenException('Enrol in this course to sit its test papers.');
    const courseModule = await this.courseModuleModel
      .findOne({ course: courseId, testPapers: testPaperId, _deleted: { $ne: true } })
      .lean<CourseModuleDocument>();
    if (!courseModule) return null;
    return this.testPaperService.getSectionsWithQuestions(course.org, testPaperId);
  }

  /**
   * Saves a sitting of a paper reached through a course. The same two checks as reading the paper
   * — the course is visible to the caller and the paper sits in one of its modules — and then the
   * marking reads the questions under the course owner's organization.
   */
  async upsertTestPaperResult(
    org: Types.ObjectId,
    userId: Types.ObjectId,
    payload: TestPaperResultDto,
  ): Promise<TestPaperResultDto | null> {
    const course = await this.getVisibleCourse(org, payload.course);
    if (!course) return null;
    if (!(await this.canOpen(course))) throw new ForbiddenException('Enrol in this course to sit its test papers.');
    const courseModule = await this.courseModuleModel
      .findOne({ course: payload.course, testPapers: payload.testPaper, _deleted: { $ne: true } })
      .lean<CourseModuleDocument>();
    if (!courseModule) return null;
    return this.testPaperResultService.upsert(course.org, userId, payload);
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
    const course = await this.getVisibleCourse(org, payload.course);
    if (!course || !(await this.canOpen(course))) {
      throw new ForbiddenException('Enrol in this course to track progress.');
    }
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
