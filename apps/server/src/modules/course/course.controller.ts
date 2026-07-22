import { Controller, Get, Post, Body, Param, Query, HttpStatus } from '@nestjs/common';
import { CourseService } from './course.service';
import { RequestContextService } from '../../context/request-context.service';
import { UpsertCourseDto } from '@parthhub/shared/validations';

@Controller('course')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('teach/upsert')
  async upsertCourse(@Body() payload: UpsertCourseDto) {
    const userId = this.requestContextService.getUserId();
    const orgId = this.requestContextService.getOrgId();
    const data = await this.courseService.upsert(userId, orgId, payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/all')
  async getOrgCourses() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.courseService.getOrgCourses(orgId);
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/:id')
  async getCourseById(@Param('id') id: string) {
    const data = await this.courseService.getCourseById(id);
    return { data, status: HttpStatus.OK };
  }

  @Get('learn/all')
  async getLearnCourses() {
    const orgId = this.requestContextService.getOrgId();
    const data = await this.courseService.getOrgCourses(orgId);
    return { data, status: HttpStatus.OK };
  }

  @Get()
  async findAll(@Query('org') org: string) {
    return this.courseService.findAll(org);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.courseService.findById(id);
  }
}
