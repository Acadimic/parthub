import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { CourseService } from './course.service';
import { RequestContextService } from '../../context/request-context.service';
import {
  BulkUpsertCourseModulesDto,
  CourseDto,
  CourseModuleDto,
  CourseWithPlansDto,
  LinkCourseContentDto,
  PlanDto,
} from '@repo/shared/validations';

@Controller('course')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly requestContextService: RequestContextService,
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
  @Post('link-content')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.CREATE_COURSE, PermissionItem.EDIT_COURSE)
  async linkCourseContent(@Body() payload: LinkCourseContentDto): Promise<CourseModuleDto> {
    const org = this.requestContextService.getOrgId();
    const courseModule = await this.courseService.linkCourseContent(org, payload);
    if (!courseModule) throw new NotFoundException('Course module not found.');
    return courseModule;
  }

  @Get('course/modules/:courseId')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCourseModules(@Param('courseId') courseId: string): Promise<CourseModuleDto[]> {
    return this.courseService.getOrgCourseModules(this.requestContextService.getOrgId(), courseId);
  }

  // Declared after the routes above so the literal paths read together; `:id` is one segment and
  // they are three or four, so the order does not affect matching.
  @Get(':id')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCourseById(@Param('id') id: string): Promise<CourseDto> {
    const course = await this.courseService.getOrgCourseById(this.requestContextService.getOrgId(), id);
    if (!course) throw new NotFoundException('Course not found.');
    return course;
  }
}
