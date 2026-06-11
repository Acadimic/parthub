import { Controller, Get, Param, Query } from '@nestjs/common';
import { SubjectService } from './subject.service';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  async findAll(@Query('org') org: string) {
    return this.subjectService.findAll(org);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.subjectService.findById(id);
  }
}
