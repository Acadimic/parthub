import { Subdomain } from '@repo/shared/enums';
import { Private } from '@decorators';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { SubjectDto } from '@repo/shared/validations';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  // Private, not authenticated — see the note on StandardController.upsertStandard.
  @Private()
  @Post('upsert')
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

  /**
   * The support dashboard's machine-to-machine twin of `all`.
   *
   * Declared above `@Get(':id')` on purpose: Nest matches in declaration order, and a param route
   * would otherwise swallow `private-all` as an id.
   */
  @Private()
  @Get('private-all')
  async privateGetAllSubjects() {
    const data = await this.subjectService.getAll();
    return data;
  }

  @Get(':id')
  @Permissions()
  async findById(@Param('id') id: string) {
    return this.subjectService.findById(id);
  }
}
