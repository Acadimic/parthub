import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { SubjectDto } from '@repo/shared/validations';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post('upsert')
  @Subdomains(Subdomain.SUPPORT)
  @Permissions(PermissionItem.MANAGE_SUBJECT)
  async upsertSubject(@Body() payload: SubjectDto) {
    const data = await this.subjectService.upsert(payload);
    return data;
  }

  @Get('all')
  @Subdomains(Subdomain.SUPPORT, Subdomain.TEACH, Subdomain.LEARN)
  @Permissions()
  async getAllSubjects() {
    const data = await this.subjectService.getAll();
    return data;
  }

  @Get(':id')
  @Permissions()
  async findById(@Param('id') id: string) {
    return this.subjectService.findById(id);
  }
}
