import { Subdomain } from '@repo/shared/enums';
import { Private } from '@decorators';
import { Subdomains } from '@decorators/subdomains.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { Controller, Get, Post, Body, NotFoundException, Param, ParseArrayPipe } from '@nestjs/common';
import { StandardSubjectMappingService } from '@modules/standard/standard-subject-mapping.service';
import { SubjectService } from './subject.service';
import { SubjectDto, SubjectIdDto } from '@repo/shared/validations';

@Controller('subject')
export class SubjectController {
  constructor(
    private readonly subjectService: SubjectService,
    private readonly standardSubjectMappingService: StandardSubjectMappingService,
  ) {}

  // Private, not authenticated — see the note on StandardController.upsertStandard.
  @Private()
  @Post('upsert')
  async upsertSubject(@Body() payload: SubjectDto) {
    const data = await this.subjectService.upsert(payload);
    return data;
  }

  /** The import route: every subject of a seed file in one request. Private like `upsert`. */
  @Private()
  @Post('bulk-upsert')
  async bulkUpsertSubjects(
    @Body(new ParseArrayPipe({ items: SubjectDto, whitelist: true, forbidNonWhitelisted: true }))
    payloads: SubjectDto[],
  ) {
    const data = await this.subjectService.bulkUpsert(payloads);
    return data;
  }

  /**
   * Soft-deletes a subject and every standard mapping that points at it, so no standard is left
   * listing a subject the API no longer returns. See `StandardController.deleteStandard`.
   */
  @Private()
  @Post('delete')
  async deleteSubject(@Body() body: SubjectIdDto): Promise<void> {
    const deleted = await this.subjectService.softDelete(body.subjectId);
    if (!deleted) throw new NotFoundException('Subject not found.');
    await this.standardSubjectMappingService.deleteSubjectMappings(body.subjectId);
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
    const subject = await this.subjectService.findById(id);
    if (!subject) throw new NotFoundException('Subject not found.');
    return subject;
  }
}
