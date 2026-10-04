import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Public } from '@decorators/public.decorator';
import { S3Service } from '@modules/s3/s3.service';
import { TestPaperResultService } from '@modules/test-paper/test-paper-result.service';
import { Controller, Get, Post, Body, Param, NotFoundException, ParseBoolPipe, Query } from '@nestjs/common';
import {
  type PublishedCourseResponse,
  type PublishedCoursesResponse,
  type TestPaperSectionsResponse,
} from '@repo/shared/contracts';
import { CourseService, type ICourseModuleContents } from './course.service';
import { RequestContextService } from '../../context/request-context.service';
import {
  BulkUpsertCourseModulesDto,
  CompletedModuleDto,
  CourseDto,
  CourseModuleDto,
  CourseWithPlansDto,
  LinkCourseModuleDto,
  PlanDto,
  TestPaperResultDto,
} from '@repo/shared/validations';

@Controller('course')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly requestContextService: RequestContextService,
    private readonly testPaperResultService: TestPaperResultService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.CREATE_COURSE, PermissionItem.EDIT_COURSE)
  async upsertCourse(@Body() payload: CourseDto): Promise<CourseDto> {
    const org = this.requestContextService.getOrgId();
    return this.courseService.upsert(org, payload);
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getOrgCourses(): Promise<CourseDto[]> {
    const courses = await this.courseService.getOrgCourses(this.requestContextService.getOrgId());
    return courses;
  }

  @Post('upsert/course/plans')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.CREATE_COURSE, PermissionItem.EDIT_COURSE)
  async upsertCourseAndPlans(@Body() payload: CourseWithPlansDto): Promise<{ course: CourseDto; plans: PlanDto[] }> {
    const org = this.requestContextService.getOrgId();
    return this.courseService.upsertCourseAndPlans(org, payload);
  }

  @Post('upsert/course/module')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.CREATE_COURSE, PermissionItem.EDIT_COURSE)
  async upsertCourseModule(@Body() payload: CourseModuleDto): Promise<CourseModuleDto> {
    const org = this.requestContextService.getOrgId();
    return this.courseService.upsertCourseModule(org, payload);
  }

  /** A generated course's modules in one request, in file order. */
  @Post('upsert/course/modules')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.CREATE_COURSE, PermissionItem.EDIT_COURSE)
  async bulkUpsertCourseModules(@Body() payload: BulkUpsertCourseModulesDto): Promise<CourseModuleDto[]> {
    const org = this.requestContextService.getOrgId();
    return this.courseService.bulkUpsertCourseModules(org, payload.modules);
  }

  /** Appends generated content to a module and settles the pending items it fulfils. */
  @Post('link-module')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.CREATE_COURSE, PermissionItem.EDIT_COURSE)
  async linkCourseModule(@Body() payload: LinkCourseModuleDto): Promise<CourseModuleDto> {
    const org = this.requestContextService.getOrgId();
    const courseModule = await this.courseService.linkCourseModule(org, payload);
    if (!courseModule) throw new NotFoundException('Course module not found.');
    return courseModule;
  }

  @Get('course/modules/:courseId')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCourseModules(@Param('courseId') courseId: string): Promise<CourseModuleDto[]> {
    return this.courseService.getOrgCourseModules(this.requestContextService.getOrgId(), courseId);
  }

  /** The plans a visible course is sold on. `plan/course/:id` is teach-only and org-scoped. */
  @Get('plans/:courseId')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCoursePlans(@Param('courseId') courseId: string): Promise<PlanDto[]> {
    const plans = await this.courseService.getVisibleCoursePlans(this.requestContextService.getOrgId(), courseId);
    if (!plans) throw new NotFoundException('Course not found.');
    return plans;
  }

  /** A course's modules with their materials, test papers and meets embedded. */
  @Get('course/modules/contents/:courseId')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCourseModulesWithContents(@Param('courseId') courseId: string): Promise<ICourseModuleContents[]> {
    const org = this.requestContextService.getOrgId();
    const courseModules = await this.courseService.getCourseModulesWithContents(org, courseId);
    if (!courseModules) throw new NotFoundException('Course not found.');
    return courseModules;
  }

  /**
   * One module with its items embedded. A whole course's lesson bodies can run to megabytes, so a
   * printout of a single module asks for that module alone.
   */
  @Get('course/module/contents/:courseId/:moduleId')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCourseModuleWithContents(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
  ): Promise<ICourseModuleContents> {
    const org = this.requestContextService.getOrgId();
    const [courseModule] =
      (await this.courseService.getCourseModulesWithContents(org, courseId, 'contents', moduleId)) ?? [];
    if (!courseModule) throw new NotFoundException('Module not found.');
    return courseModule;
  }

  /** The syllabus alone: modules and their items with no lesson bodies or files. */
  @Get('course/modules/outline/:courseId')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCourseModulesOutline(@Param('courseId') courseId: string): Promise<ICourseModuleContents[]> {
    const org = this.requestContextService.getOrgId();
    const courseModules = await this.courseService.getCourseModulesWithContents(org, courseId, 'outline');
    if (!courseModules) throw new NotFoundException('Course not found.');
    return courseModules;
  }

  /**
   * A test paper inside a course, with its sections and questions.
   *
   * The course is named as well as the paper because a published course is readable across
   * organizations while `test-paper/sections-with-questions` reads under the caller's own — which
   * answers with an empty paper rather than an error, so the exam simply opened blank.
   */
  @Get('test-paper/sections/:courseId/:testPaperId')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_TEST_PAPER)
  async getCourseTestPaperSections(
    @Param('courseId') courseId: string,
    @Param('testPaperId') testPaperId: string,
  ): Promise<TestPaperSectionsResponse> {
    const org = this.requestContextService.getOrgId();
    const sections = await this.courseService.getCourseTestPaperSections(org, courseId, testPaperId);
    if (!sections) throw new NotFoundException('Test paper not found.');
    return sections;
  }

  /** The caller's own progress rows, across every course they have started. */
  @Get('completed/modules')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCompletedModules(): Promise<CompletedModuleDto[]> {
    return this.courseService.getCompletedModules(this.requestContextService.getUserId());
  }

  @Post('completed/module/upsert')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async upsertCompletedModule(@Body() payload: CompletedModuleDto): Promise<CompletedModuleDto> {
    const org = this.requestContextService.getOrgId();
    return this.courseService.upsertCompletedModule(org, this.requestContextService.getUserId(), payload);
  }

  /** The caller's own sittings, newest first. */
  @Get('test-paper/results')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_TEST_PAPER)
  async getTestPaperResults(): Promise<TestPaperResultDto[]> {
    return this.testPaperResultService.getByUser(this.requestContextService.getUserId());
  }

  /** Saves and marks a sitting. Idempotent on the client-minted `_id`, so a retried save is safe. */
  @Post('test-paper/result/upsert')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_TEST_PAPER)
  async upsertTestPaperResult(@Body() payload: TestPaperResultDto): Promise<TestPaperResultDto> {
    const org = this.requestContextService.getOrgId();
    const result = await this.courseService.upsertTestPaperResult(org, this.requestContextService.getUserId(), payload);
    if (!result) throw new NotFoundException('Test paper not found in this course.');
    return result;
  }

  /**
   * The public catalogue, across organizations. `@Public()` because the learning app's `/courses`
   * and landing page are browsed by anonymous visitors, the same way `common/public-data` is, and
   * `?signed=true` likewise adds signed URLs for every course image. A course's `attachments` are
   * only its images (lesson files belong to materials), so signing them all exposes nothing private.
   */
  @Public()
  @Get('published')
  async getPublishedCourses(
    @Query('signed', new ParseBoolPipe({ optional: true })) signed?: boolean,
  ): Promise<PublishedCoursesResponse> {
    const courses = await this.courseService.getPublicCourses();
    const images = courses.flatMap((course) => (course.attachments ?? []).map((attachment) => attachment.url));
    const presignedUrls = signed ? await this.s3Service.presignStoredReferences(images) : [];
    return { courses, presignedUrls };
  }

  /** One published course, for the learning app to describe a shared link to a link preview. */
  @Public()
  @Get('published/:courseId')
  async getPublishedCourse(@Param('courseId') courseId: string): Promise<PublishedCourseResponse> {
    const course = await this.courseService.getPublicCourse(courseId);
    if (!course) throw new NotFoundException('Course not found.');
    const images = (course.attachments ?? []).map((attachment) => attachment.url);
    return { course, presignedUrls: await this.s3Service.presignStoredReferences(images) };
  }

  /** A published course's syllabus for a visitor who is not signed in. */
  @Public()
  @Get('published/outline/:courseId')
  async getPublishedCourseOutline(@Param('courseId') courseId: string): Promise<ICourseModuleContents[]> {
    const courseModules = await this.courseService.getPublicCourseOutline(courseId);
    if (!courseModules) throw new NotFoundException('Course not found.');
    return courseModules;
  }

  /** The plans a published course is sold on, for a visitor who is not signed in. */
  @Public()
  @Get('published/plans/:courseId')
  async getPublishedCoursePlans(@Param('courseId') courseId: string): Promise<PlanDto[]> {
    const plans = await this.courseService.getPublicCoursePlans(courseId);
    if (!plans) throw new NotFoundException('Course not found.');
    return plans;
  }

  // `published` above and `:id` here are both a single segment, so this one must stay last or it
  // would swallow it and look up a course whose id is the literal string "published".
  @Get(':id')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCourseById(@Param('id') id: string): Promise<CourseDto> {
    const course = await this.courseService.getOrgCourseById(this.requestContextService.getOrgId(), id);
    if (!course) throw new NotFoundException('Course not found.');
    return course;
  }
}
