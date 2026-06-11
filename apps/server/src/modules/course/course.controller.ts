import { Controller, Get, Param, Query } from '@nestjs/common';
import { CourseService } from './course.service';

@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async findAll(@Query('org') org: string) {
    return this.courseService.findAll(org);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.courseService.findById(id);
  }
}
