import { PermissionItem, Subdomain } from '@parthhub/shared';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param, Query, HttpStatus } from '@nestjs/common';
import { toCourseDto } from './course.mapper';
import { CourseService } from './course.service';
import { RequestContextService } from '../../context/request-context.service';
import { CourseDto } from '@parthhub/shared/validations';

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
    const userId = this.requestContextService.getUserId();
    const org = this.requestContextService.getOrgId();
    return toCourseDto(await this.courseService.upsert(userId, org, payload));
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getOrgCourses(): Promise<CourseDto[]> {
    const courses = await this.courseService.getOrgCourses(this.requestContextService.getOrgId());
    return courses.map(toCourseDto);
  }

  @Get(':id')
  @Subdomains(Subdomain.TEACH, Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getCourseById(@Param('id') id: string): Promise<CourseDto> {
    return toCourseDto(await this.courseService.getOrgCourseById(this.requestContextService.getOrgId(), id));
  }
}
