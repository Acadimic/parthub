import { Controller, Get, Param, Query } from '@nestjs/common';
import { MaterialService } from './material.service';

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  async findAll(@Query('org') org: string) {
    return this.materialService.findAll(org);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.materialService.findById(id);
  }

  @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.materialService.findByCourse(courseId);
  }
}
