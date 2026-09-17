import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { CourseService } from './course.service';
import { RequestContextService } from '../../context/request-context.service';
import { CourseDto } from '@repo/shared/validations';

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

  @Get(':id')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCourseById(@Param('id') id: string): Promise<CourseDto> {
    const course = await this.courseService.getOrgCourseById(this.requestContextService.getOrgId(), id);
    if (!course) throw new NotFoundException('Course not found.');
    return course;
  }
}
