import { Controller, Get, Post, Body, Param, Query, HttpStatus } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { UpsertSubjectDto } from '@parthhub/shared/validations';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post('admin/upsert')
  async upsertSubject(
    @Body() payload: UpsertSubjectDto,
  ) {
    const data = await this.subjectService.upsert(payload);
    return { data, status: HttpStatus.OK };
  }

  @Get('admin/all')
  async getAdminAll() {
    const data = await this.subjectService.getAll();
    return { data, status: HttpStatus.OK };
  }

  @Get('teach/all')
  async getTeachAll() {
    const data = await this.subjectService.getAll();
    return { data, status: HttpStatus.OK };
  }

  @Get()
  async findAll(@Query('org') org: string) {
    return this.subjectService.findAll(org);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.subjectService.findById(id);
  }
}
